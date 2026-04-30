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
      include: {
        _count: { select: { attendees: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

export const getEventByCode = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: code }) => {
    return prisma.event.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: { select: { attendees: true } },
      },
    })
  })

export const getEventById = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    return prisma.event.findUnique({
      where: { id },
      include: {
        _count: { select: { attendees: true } },
      },
    })
  })

export const createEvent = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    location: z.string().max(200).optional(),
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
  .handler(async ({ data: eventId }) => {
    const session = await requireSession()

    return prisma.eventAttendee.upsert({
      where: {
        eventId_userId: { eventId, userId: session.user.id },
      },
      update: { leftAt: null },
      create: { eventId, userId: session.user.id },
    })
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
