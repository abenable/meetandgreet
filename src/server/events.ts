import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getRequest } from '@tanstack/react-start/server'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'

async function requireSession() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const listEvents = createServerFn({ method: 'GET' })
  .handler(async () => {
    return prisma.event.findMany({
      omit: { code: true },
      include: {
        _count: { select: { attendees: { where: { leftAt: null } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

export const getEventByCode = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: code }) => {
    const event = await prisma.event.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: { select: { attendees: { where: { leftAt: null } } } },
      },
    })

    if (!event) return null

    const now = new Date()
    if (!event.isActive) return null
    if (event.endedAt && event.endedAt <= now) return null
    if (event.startsAt && event.startsAt > now) return null

    return event
  })

export const getEventById = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    const session = await requireSession()

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: { select: { attendees: { where: { leftAt: null } } } },
      },
    })

    if (!event) return null

    const isCreator = event.createdById === session.user.id
    if (!isCreator) {
      const { code, ...rest } = event
      return rest
    }

    return event
  })

export const createEvent = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    location: z.string().max(200).optional(),
    maxAttendees: z.number().int().min(1).max(1000).optional(),
    startsAt: z.string().datetime().optional(),
  }))
  .handler(async ({ data }) => {
    const session = await requireSession()

    return prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          code: generateCode(),
          name: data.name,
          description: data.description,
          location: data.location,
          maxAttendees: data.maxAttendees,
          startsAt: data.startsAt ? new Date(data.startsAt) : null,
          createdById: session.user.id,
        },
      })
      await tx.eventAttendee.create({
        data: { eventId: event.id, userId: session.user.id },
      })
      return event
    })
  })

export const joinEvent = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: code }) => {
    const session = await requireSession()
    const now = new Date()

    const event = await prisma.event.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: { select: { attendees: { where: { leftAt: null } } } },
      },
    })

    if (!event) {
      return { success: false, message: 'Event not found' }
    }

    if (!event.isActive) {
      return { success: false, message: 'Event is not active' }
    }

    if (event.startsAt && event.startsAt > now) {
      return { success: false, message: 'Event has not started yet' }
    }

    if (event.endedAt && event.endedAt <= now) {
      return { success: false, message: 'Event has ended' }
    }

    if (event.maxAttendees !== null && event._count.attendees >= event.maxAttendees) {
      return { success: false, message: 'Event is full' }
    }

    const blocked = await prisma.eventBlockedUser.findUnique({
      where: {
        eventId_userId: { eventId: event.id, userId: session.user.id },
      },
    })
    if (blocked) {
      return { success: false, message: 'You have been blocked from this event' }
    }

    const existing = await prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: { eventId: event.id, userId: session.user.id },
      },
    })

    if (existing && existing.leftAt === null) {
      return { success: false, message: 'You are already attending this event' }
    }

    await prisma.eventAttendee.upsert({
      where: {
        eventId_userId: { eventId: event.id, userId: session.user.id },
      },
      update: { leftAt: null, removedById: null, removedAt: null },
      create: { eventId: event.id, userId: session.user.id },
    })

    return { success: true }
  })

export const leaveEvent = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: eventId }) => {
    const session = await requireSession()

    await prisma.eventAttendee.update({
      where: {
        eventId_userId: { eventId, userId: session.user.id },
      },
      data: { leftAt: new Date() },
    })
  })

export const getMyCreatedEvents = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()

    return prisma.event.findMany({
      where: { createdById: session.user.id },
      include: {
        _count: { select: { attendees: { where: { leftAt: null } } } },
      },
    })
  })

export const updateEvent = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    eventId: z.string(),
    data: z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      location: z.string().max(200).optional(),
      maxAttendees: z.number().int().min(1).max(1000).optional(),
      startsAt: z.string().datetime().optional(),
      endedAt: z.string().datetime().optional(),
      isActive: z.boolean().optional(),
    }),
  }))
  .handler(async ({ data }) => {
    const session = await requireSession()

    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.createdById !== session.user.id) {
      throw new Error('Unauthorized')
    }

    return prisma.event.update({
      where: { id: data.eventId },
      data: {
        name: data.data.name,
        description: data.data.description,
        location: data.data.location,
        maxAttendees: data.data.maxAttendees,
        startsAt: data.data.startsAt ? new Date(data.data.startsAt) : undefined,
        endedAt: data.data.endedAt ? new Date(data.data.endedAt) : undefined,
        isActive: data.data.isActive,
      },
    })
  })

export const deleteEvent = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: eventId }) => {
    const session = await requireSession()

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.createdById !== session.user.id) {
      throw new Error('Unauthorized')
    }

    await prisma.event.delete({
      where: { id: eventId },
    })
  })

export const getMyActiveEvent = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()

    const attendee = await prisma.eventAttendee.findFirst({
      where: { userId: session.user.id, leftAt: null },
      include: {
        event: {
          include: {
            _count: { select: { attendees: { where: { leftAt: null } } } },
          },
        },
      },
    })
    return attendee?.event ?? null
  })

export const getEventProfiles = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: eventId }) => {
    const session = await requireSession()
    const myUserId = session.user.id

    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId, leftAt: null },
      select: { userId: true },
    })
    const userIds = attendees.map((a) => a.userId).filter((id) => id !== myUserId)

    if (userIds.length === 0) return []

    // Exclude people the current user has passed on
    const passes = await prisma.eventSwipe.findMany({
      where: { eventId, swiperId: myUserId, direction: 'pass' },
      select: { swipedId: true },
    })
    const passedIds = passes.map((p) => p.swipedId)
    const visibleUserIds = userIds.filter((id) => !passedIds.includes(id))

    if (visibleUserIds.length === 0) return []

    return prisma.profile.findMany({
      where: { userId: { in: visibleUserIds } },
    })
  })

export const getEventAttendees = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: eventId }) => {
    await requireSession()

    const rows = await prisma.eventAttendee.findMany({
      where: { eventId, leftAt: null },
      select: { userId: true },
    })
    const userIds = rows.map((r) => r.userId)

    if (userIds.length === 0) return []

    return prisma.profile.findMany({
      where: { userId: { in: userIds } },
    })
  })

export const removeEventAttendee = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ eventId: z.string(), userId: z.string() }))
  .handler(async ({ data }) => {
    const session = await requireSession()

    const event = await prisma.event.findUnique({ where: { id: data.eventId } })
    if (!event) throw new Error('Event not found')
    if (event.createdById !== session.user.id) throw new Error('Unauthorized')

    await prisma.eventAttendee.update({
      where: { eventId_userId: { eventId: data.eventId, userId: data.userId } },
      data: { leftAt: new Date(), removedById: session.user.id, removedAt: new Date() },
    })

    return { success: true }
  })

export const blockEventAttendee = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ eventId: z.string(), userId: z.string(), reason: z.string().optional() }))
  .handler(async ({ data }) => {
    const session = await requireSession()

    const event = await prisma.event.findUnique({ where: { id: data.eventId } })
    if (!event) throw new Error('Event not found')
    if (event.createdById !== session.user.id) throw new Error('Unauthorized')

    await prisma.eventBlockedUser.upsert({
      where: { eventId_userId: { eventId: data.eventId, userId: data.userId } },
      update: { reason: data.reason ?? null, blockedById: session.user.id },
      create: {
        eventId: data.eventId,
        userId: data.userId,
        blockedById: session.user.id,
        reason: data.reason,
      },
    })

    // Also remove them from attendees if they are still in
    await prisma.eventAttendee.updateMany({
      where: { eventId: data.eventId, userId: data.userId, leftAt: null },
      data: { leftAt: new Date(), removedById: session.user.id, removedAt: new Date() },
    })

    return { success: true }
  })

export const unblockEventAttendee = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ eventId: z.string(), userId: z.string() }))
  .handler(async ({ data }) => {
    const session = await requireSession()

    const event = await prisma.event.findUnique({ where: { id: data.eventId } })
    if (!event) throw new Error('Event not found')
    if (event.createdById !== session.user.id) throw new Error('Unauthorized')

    await prisma.eventBlockedUser.deleteMany({
      where: { eventId: data.eventId, userId: data.userId },
    })

    return { success: true }
  })

export const getEventBlockedUsers = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: eventId }) => {
    const session = await requireSession()

    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) throw new Error('Event not found')
    if (event.createdById !== session.user.id) throw new Error('Unauthorized')

    const blocked = await prisma.eventBlockedUser.findMany({
      where: { eventId },
      select: { userId: true, reason: true, blockedAt: true },
    })

    const userIds = blocked.map((b) => b.userId)
    if (userIds.length === 0) return []

    const profiles = await prisma.profile.findMany({
      where: { userId: { in: userIds } },
    })

    return blocked.map((b) => {
      const profile = profiles.find((p) => p.userId === b.userId)
      return { ...b, profile }
    })
  })

export const sendOrganizerMessage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    eventId: z.string(),
    receiverId: z.string(),
    content: z.string().min(1).max(2000),
  }))
  .handler(async ({ data }) => {
    const session = await requireSession()

    const event = await prisma.event.findUnique({ where: { id: data.eventId } })
    if (!event) throw new Error('Event not found')
    if (event.createdById !== session.user.id) throw new Error('Unauthorized')

    // Verify receiver is still attending
    const attendee = await prisma.eventAttendee.findFirst({
      where: { eventId: data.eventId, userId: data.receiverId, leftAt: null },
    })
    if (!attendee) throw new Error('User is not attending this event')

    return prisma.eventOrganizerMessage.create({
      data: {
        eventId: data.eventId,
        senderId: session.user.id,
        receiverId: data.receiverId,
        content: data.content,
      },
    })
  })

export const getOrganizerMessages = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ eventId: z.string(), receiverId: z.string() }))
  .handler(async ({ data }) => {
    const session = await requireSession()

    const event = await prisma.event.findUnique({ where: { id: data.eventId } })
    if (!event) throw new Error('Event not found')
    if (event.createdById !== session.user.id) throw new Error('Unauthorized')

    return prisma.eventOrganizerMessage.findMany({
      where: { eventId: data.eventId, receiverId: data.receiverId },
      orderBy: { createdAt: 'asc' },
    })
  })

export const getMyOrganizerMessages = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()

    return prisma.eventOrganizerMessage.findMany({
      where: { receiverId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  })

async function checkEventChatPermission(eventId: string, userId: string, peerId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) throw new Error('Event not found')

  const [meAttendee, peerAttendee] = await Promise.all([
    prisma.eventAttendee.findFirst({ where: { eventId, userId, leftAt: null } }),
    prisma.eventAttendee.findFirst({ where: { eventId, userId: peerId, leftAt: null } }),
  ])

  if (!meAttendee) throw new Error('You must be attending this event')
  if (!peerAttendee) throw new Error('The other user is not attending this event')

  const isOrganizer = (id: string) => event.createdById === id
  if (isOrganizer(userId) || isOrganizer(peerId)) {
    return { allowed: true, isOrganizer: true, event }
  }

  const [myLike, theirLike] = await Promise.all([
    prisma.eventSwipe.findFirst({
      where: { eventId, swiperId: userId, swipedId: peerId, direction: { in: ['like', 'super'] } },
    }),
    prisma.eventSwipe.findFirst({
      where: { eventId, swiperId: peerId, swipedId: userId, direction: { in: ['like', 'super'] } },
    }),
  ])

  if (!myLike || !theirLike) {
    throw new Error('You can only chat with mutual matches or the event organizer')
  }

  return { allowed: true, isOrganizer: false, event }
}

export const getEventChat = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ eventId: z.string(), peerId: z.string() }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    await checkEventChatPermission(data.eventId, session.user.id, data.peerId)

    const rows = await prisma.eventOrganizerMessage.findMany({
      where: {
        eventId: data.eventId,
        OR: [
          { senderId: session.user.id, receiverId: data.peerId },
          { senderId: data.peerId, receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
    })

    return rows.map((msg) => ({ ...msg, isMine: msg.senderId === session.user.id }))
  })

export const sendEventChat = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    eventId: z.string(),
    peerId: z.string(),
    content: z.string().min(1).max(2000),
  }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    await checkEventChatPermission(data.eventId, session.user.id, data.peerId)

    return prisma.eventOrganizerMessage.create({
      data: {
        eventId: data.eventId,
        senderId: session.user.id,
        receiverId: data.peerId,
        content: data.content,
      },
    })
  })

export const markOrganizerMessagesRead = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ eventId: z.string(), senderId: z.string() }))
  .handler(async ({ data }) => {
    const session = await requireSession()

    await prisma.eventOrganizerMessage.updateMany({
      where: {
        eventId: data.eventId,
        senderId: data.senderId,
        receiverId: session.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    })

    return { success: true }
  })

export const reportUser = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    eventId: z.string(),
    reportedId: z.string(),
    reason: z.string().min(1).max(1000),
  }))
  .handler(async ({ data }) => {
    const session = await requireSession()

    // Both users should be attending the event
    const [reporterAttendee, reportedAttendee] = await Promise.all([
      prisma.eventAttendee.findFirst({
        where: { eventId: data.eventId, userId: session.user.id, leftAt: null },
      }),
      prisma.eventAttendee.findFirst({
        where: { eventId: data.eventId, userId: data.reportedId, leftAt: null },
      }),
    ])

    if (!reporterAttendee) {
      return { success: false, message: 'You must be attending the event to report someone' }
    }
    if (!reportedAttendee) {
      return { success: false, message: 'Reported user is not attending this event' }
    }

    await prisma.report.create({
      data: {
        eventId: data.eventId,
        reporterId: session.user.id,
        reportedId: data.reportedId,
        reason: data.reason,
      },
    })

    return { success: true }
  })

export const getEventReports = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: eventId }) => {
    const session = await requireSession()

    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) throw new Error('Event not found')
    if (event.createdById !== session.user.id) throw new Error('Unauthorized')

    const reports = await prisma.report.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    })

    const userIds = [...new Set(reports.flatMap((r) => [r.reporterId, r.reportedId]))]
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: userIds } },
    })

    return reports.map((r) => ({
      ...r,
      reporter: profiles.find((p) => p.userId === r.reporterId),
      reported: profiles.find((p) => p.userId === r.reportedId),
    }))
  })
