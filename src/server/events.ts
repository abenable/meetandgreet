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
        _count: { select: { attendees: true } },
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
        _count: { select: { attendees: true } },
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
        _count: { select: { attendees: true } },
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
        _count: { select: { attendees: true } },
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
      update: { leftAt: null },
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
        _count: { select: { attendees: true } },
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
            _count: { select: { attendees: true } },
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

    return prisma.profile.findMany({
      where: { userId: { in: userIds } },
    })
  })
