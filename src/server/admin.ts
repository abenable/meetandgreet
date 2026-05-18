import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '#/db'
import { requireAdmin } from '#/server/auth'

export const getAdminStats = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdmin()

    const [
      totalUsers,
      totalEvents,
      activeEvents,
      totalMatches,
      totalMessages,
      totalReports,
      pendingReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.event.count({ where: { isActive: true, endedAt: null } }),
      prisma.eventMatch.count(),
      prisma.eventMessage.count(),
      prisma.report.count(),
      prisma.report.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ])

    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    })

    return {
      totalUsers,
      totalEvents,
      activeEvents,
      totalMatches,
      totalMessages,
      totalReports,
      pendingReports,
      recentUsers,
    }
  })

export const getAllUsers = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).default(50),
    search: z.string().optional(),
  }).optional())
  .handler(async ({ data }) => {
    await requireAdmin()

    const limit = data?.limit || 50
    const cursor = data?.cursor
    const search = data?.search

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        disabledAt: true,
        createdAt: true,
        _count: {
          select: {
            sessions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    })

    const hasMore = users.length > limit
    const items = hasMore ? users.slice(0, limit) : users

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    }
  })

export const updateUserRole = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    userId: z.string(),
    role: z.enum(['user', 'admin']),
  }))
  .handler(async ({ data }) => {
    await requireAdmin()

    await prisma.user.update({
      where: { id: data.userId },
      data: { role: data.role },
    })

    return { success: true }
  })

export const toggleUserDisabled = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    userId: z.string(),
    disabled: z.boolean(),
  }))
  .handler(async ({ data }) => {
    await requireAdmin()

    await prisma.user.update({
      where: { id: data.userId },
      data: {
        disabledAt: data.disabled ? new Date() : null,
      },
    })

    if (data.disabled) {
      await prisma.session.deleteMany({
        where: { userId: data.userId },
      })
      await prisma.eventAttendee.updateMany({
        where: { userId: data.userId, leftAt: null },
        data: { leftAt: new Date() },
      })
    }

    return { success: true }
  })

export const getAllEvents = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).default(50),
  }).optional())
  .handler(async ({ data }) => {
    await requireAdmin()

    const limit = data?.limit || 50
    const cursor = data?.cursor

    const events = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        photo: true,
        location: true,
        isActive: true,
        isPublic: true,
        createdAt: true,
        startsAt: true,
        endedAt: true,
        createdById: true,
        maxAttendees: true,
        _count: {
          select: {
            attendees: { where: { leftAt: null } },
            swipes: true,
            matches: true,
            waitlist: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    })

    const hasMore = events.length > limit
    const items = hasMore ? events.slice(0, limit) : events

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    }
  })

export const adminDeleteEvent = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: eventId }) => {
    await requireAdmin()

    await prisma.event.delete({
      where: { id: eventId },
    })

    return { success: true }
  })

export const adminToggleEventActive = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    eventId: z.string(),
    active: z.boolean(),
  }))
  .handler(async ({ data }) => {
    await requireAdmin()

    await prisma.event.update({
      where: { id: data.eventId },
      data: { isActive: data.active },
    })

    return { success: true }
  })

export const getAllReports = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).default(50),
  }).optional())
  .handler(async ({ data }) => {
    await requireAdmin()

    const limit = data?.limit || 50
    const cursor = data?.cursor

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    })

    const userIds = [...new Set(reports.flatMap((r) => [r.reporterId, r.reportedId]))]

    const [profiles, users] = await Promise.all([
      prisma.profile.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, name: true, photos: true },
      }),
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, image: true, disabledAt: true },
      }),
    ])

    const userById = new Map(users.map((u) => [u.id, u]))
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]))

    const hasMore = reports.length > limit
    const items = hasMore ? reports.slice(0, limit) : reports

    return {
      items: items.map((r) => ({
        ...r,
        reporter: {
          ...userById.get(r.reporterId),
          profile: profileByUserId.get(r.reporterId),
        },
        reported: {
          ...userById.get(r.reportedId),
          profile: profileByUserId.get(r.reportedId),
        },
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    }
  })

export const deleteReport = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: reportId }) => {
    await requireAdmin()

    await prisma.report.delete({
      where: { id: reportId },
    })

    return { success: true }
  })
