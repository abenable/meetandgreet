import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '#/db'
import { requireSession } from '#/server/auth'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '#/lib/r2'
import type { Profile } from '@prisma/client'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr]
  // Simple hash of the seed string
  let s = 0
  for (let i = 0; i < seed.length; i++) {
    s = ((s << 5) - s + seed.charCodeAt(i)) | 0
  }
  // Xorshift PRNG
  const rand = () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    s = s | 0
    return ((s >>> 0) % 100000) / 100000
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export const listEvents = createServerFn({ method: 'GET' })
  .handler(async () => {
    return prisma.event.findMany({
      where: { isPublic: true },
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

    await promoteWaitlist(event.id)

    // Re-fetch to get updated count after promotion
    return prisma.event.findUnique({
      where: { id: event.id },
      include: {
        _count: { select: { attendees: { where: { leftAt: null } } } },
      },
    })
  })

export const getEventById = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    const session = await requireSession()

    await promoteWaitlist(id)

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

async function leaveAllActiveEvents(userId: string, tx?: typeof prisma) {
  const db = tx || prisma
  await db.eventAttendee.updateMany({
    where: { userId, leftAt: null },
    data: { leftAt: new Date() },
  })
}

async function getCurrentActiveEvent(userId: string) {
  const attendee = await prisma.eventAttendee.findFirst({
    where: { userId, leftAt: null },
    include: { event: { select: { id: true, name: true } } },
  })
  return attendee?.event ?? null
}

async function promoteWaitlist(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      _count: { select: { attendees: { where: { leftAt: null } } } },
    },
  })
  if (!event) return
  if (event.endedAt && event.endedAt <= new Date()) return

  const hasStarted = !event.startsAt || event.startsAt <= new Date()
  if (!hasStarted) return

  const waitlist = await prisma.eventWaitlist.findMany({
    where: { eventId },
    orderBy: { joinedAt: 'asc' },
  })
  if (waitlist.length === 0) return

  const slotsAvailable =
    event.maxAttendees === null
      ? Infinity
      : event.maxAttendees - event._count.attendees
  if (slotsAvailable <= 0) return

  const toPromote = waitlist.slice(
    0,
    slotsAvailable === Infinity ? undefined : slotsAvailable
  )
  const userIds = toPromote.map((w) => w.userId)

  await prisma.$transaction(async (tx) => {
    await tx.eventAttendee.updateMany({
      where: { eventId, userId: { in: userIds } },
      data: { leftAt: null, removedById: null, removedAt: null },
    })
    await tx.eventAttendee.createMany({
      data: userIds.map((userId) => ({ eventId, userId })),
      skipDuplicates: true,
    })
    await tx.eventWaitlist.deleteMany({
      where: { id: { in: toPromote.map((w) => w.id) } },
    })
  })
}

export const createEvent = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    name: z.string().min(1).max(100),
    photo: z.string().optional(),
    description: z.string().max(500).optional(),
    location: z.string().max(200).optional(),
    maxAttendees: z.number().int().min(1).max(1000).optional(),
    startsAt: z.string().datetime().optional(),
    isPublic: z.boolean().optional(),
    force: z.boolean().optional(),
  }))
  .handler(async ({ data }) => {
    const session = await requireSession()

    if (!data.force) {
      const currentEvent = await getCurrentActiveEvent(session.user.id)
      if (currentEvent) {
        return { success: false, needsConfirm: true as const, currentEvent }
      }
    }

    const photoIsBase64 = data.photo && data.photo.startsWith('data:image')

    const event = await prisma.$transaction(async (tx) => {
      await leaveAllActiveEvents(session.user.id, tx)

      const event = await tx.event.create({
        data: {
          code: generateCode(),
          name: data.name,
          photo: photoIsBase64 ? null : data.photo ?? null,
          description: data.description,
          location: data.location,
          maxAttendees: data.maxAttendees,
          startsAt: data.startsAt ? new Date(data.startsAt) : null,
          createdById: session.user.id,
          isPublic: data.isPublic ?? true,
        },
      })
      await tx.eventAttendee.create({
        data: { eventId: event.id, userId: session.user.id },
      })
      return event
    })

    // Upload base64 photo to R2 after event is created so we know the eventId
    if (photoIsBase64) {
      try {
        const key = `events/${event.id}/photo-${crypto.randomUUID()}.jpg`
        const base64Data = data.photo!.split(',')[1]
        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64')
          await r2Client.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: key,
              Body: buffer,
              ContentType: 'image/jpeg',
            })
          )
          const publicUrl = `${R2_PUBLIC_URL}/${key}`
          await prisma.event.update({
            where: { id: event.id },
            data: { photo: publicUrl },
          })
          event.photo = publicUrl
        }
      } catch (err: any) {
        console.error('[Create Event] R2 photo upload failed:', err)
      }
    }

    return { success: true as const, event }
  })

export const joinEvent = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    code: z.string(),
    force: z.boolean().optional(),
  }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    const now = new Date()

    const event = await prisma.event.findUnique({
      where: { code: data.code.toUpperCase() },
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

    if (event.endedAt && event.endedAt <= now) {
      return { success: false, message: 'Event has ended' }
    }

    const blocked = await prisma.eventBlockedUser.findUnique({
      where: {
        eventId_userId: { eventId: event.id, userId: session.user.id },
      },
    })
    if (blocked) {
      return { success: false, message: 'You have been blocked from this event' }
    }

    // Promote waitlist in case event has just started
    await promoteWaitlist(event.id)

    const existing = await prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: { eventId: event.id, userId: session.user.id },
      },
    })

    if (existing && existing.leftAt === null) {
      return { success: true, alreadyJoined: true }
    }

    // If event hasn't started yet, add to waitlist
    if (event.startsAt && event.startsAt > now) {
      await prisma.eventWaitlist.upsert({
        where: { eventId_userId: { eventId: event.id, userId: session.user.id } },
        update: {},
        create: { eventId: event.id, userId: session.user.id },
      })
      return { success: true, waitlisted: true }
    }

    // Check capacity after promotion
    const freshEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        _count: { select: { attendees: { where: { leftAt: null } } } },
      },
    })
    if (freshEvent && freshEvent.maxAttendees !== null && freshEvent._count.attendees >= freshEvent.maxAttendees) {
      return { success: false, message: 'Event is full' }
    }

    if (!data.force) {
      const currentEvent = await getCurrentActiveEvent(session.user.id)
      if (currentEvent && currentEvent.id !== event.id) {
        return { success: false, needsConfirm: true as const, currentEvent, eventName: event.name }
      }
    }

    await prisma.$transaction(async (tx) => {
      await leaveAllActiveEvents(session.user.id, tx)

      await tx.eventAttendee.upsert({
        where: {
          eventId_userId: { eventId: event.id, userId: session.user.id },
        },
        update: { leftAt: null, removedById: null, removedAt: null },
        create: { eventId: event.id, userId: session.user.id },
      })
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

    await prisma.eventWaitlist.deleteMany({
      where: { eventId, userId: session.user.id },
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
      photo: z.string().optional().nullable(),
      description: z.string().max(500).optional(),
      location: z.string().max(200).optional(),
      maxAttendees: z.number().int().min(1).max(1000).optional(),
      startsAt: z.string().datetime().optional(),
      endedAt: z.string().datetime().optional(),
      isActive: z.boolean().optional(),
      isPublic: z.boolean().optional(),
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
        photo: data.data.photo,
        description: data.data.description,
        location: data.data.location,
        maxAttendees: data.data.maxAttendees,
        startsAt: data.data.startsAt ? new Date(data.data.startsAt) : undefined,
        endedAt: data.data.endedAt ? new Date(data.data.endedAt) : undefined,
        isActive: data.data.isActive,
        isPublic: data.data.isPublic,
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

    // Promote any waitlisted events that have started
    const waitlisted = await prisma.eventWaitlist.findMany({
      where: { userId: session.user.id },
      select: { eventId: true },
    })
    await Promise.all(waitlisted.map((w) => promoteWaitlist(w.eventId)))

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

    await promoteWaitlist(eventId)

    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId, leftAt: null },
      select: { userId: true },
    })
    const userIds = attendees.map((a) => a.userId).filter((id) => id !== myUserId)

    if (userIds.length === 0) return []

    // Exclude people the current user has already swiped on (passed or liked)
    const mySwipes = await prisma.eventSwipe.findMany({
      where: { eventId, swiperId: myUserId },
      select: { swipedId: true, direction: true },
    })
    const swipedIds = mySwipes.map((s) => s.swipedId)
    const visibleUserIds = userIds.filter((id) => !swipedIds.includes(id))

    if (visibleUserIds.length === 0) return []

    const [profiles, users] = await Promise.all([
      prisma.profile.findMany({ where: { userId: { in: visibleUserIds } } }),
      prisma.user.findMany({
        where: { id: { in: visibleUserIds } },
        select: { id: true, name: true, image: true, email: true, disabledAt: true },
      }),
    ])

    const userById = new Map(users.map((u) => [u.id, u]))
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]))

    // Filter out disabled accounts
    const activeUserIds = visibleUserIds.filter((id) => !userById.get(id)?.disabledAt)

    const shuffledUserIds = seededShuffle(activeUserIds, myUserId)

    return shuffledUserIds.map((userId): Profile => {
      const profile = profileByUserId.get(userId)
      const user = userById.get(userId)
      if (profile) {
        return {
          ...profile,
          name: profile.name || user?.name || 'Unnamed',
          photos:
            profile.photos && profile.photos.length > 0
              ? profile.photos
              : user?.image
                ? [user.image]
                : [],
        }
      }
      return {
        id: user?.id ?? userId,
        userId,
        name: user?.name || user?.email?.split('@')[0] || 'Unnamed',
        bio: '',
        photos: user?.image ? [user.image] : [],
        gender: '',
        birthDate: '',
        location: '',
        interests: [],
        job: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
  })

export const getEventAttendees = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: eventId }) => {
    await requireSession()

    await promoteWaitlist(eventId)

    const rows = await prisma.eventAttendee.findMany({
      where: { eventId, leftAt: null },
      select: { userId: true },
    })
    const userIds = rows.map((r) => r.userId)

    if (userIds.length === 0) return []

    const [profiles, users] = await Promise.all([
      prisma.profile.findMany({
        where: { userId: { in: userIds } },
      }),
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, image: true, email: true, disabledAt: true },
      }),
    ])

    const userById = new Map(users.map((u) => [u.id, u]))
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]))

    const activeUserIds = userIds.filter((id) => !userById.get(id)?.disabledAt)

    return activeUserIds.map((userId): Profile => {
      const profile = profileByUserId.get(userId)
      if (profile) return profile
      const user = userById.get(userId)
      return {
        id: user?.id ?? userId,
        userId,
        name: user?.name || user?.email?.split('@')[0] || 'Unnamed',
        bio: '',
        photos: user?.image ? [user.image] : [],
        gender: '',
        birthDate: '',
        location: '',
        interests: [],
        job: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
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

    const [profiles, users] = await Promise.all([
      prisma.profile.findMany({ where: { userId: { in: userIds } } }),
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, disabledAt: true },
      }),
    ])

    const userById = new Map(users.map((u) => [u.id, u]))
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]))

    return blocked
      .filter((b) => !userById.get(b.userId)?.disabledAt)
      .map((b) => {
        const profile = profileByUserId.get(b.userId)
        return { ...b, profile }
      })
  })

export const getMyWaitlistedEvents = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()

    const rows = await prisma.eventWaitlist.findMany({
      where: { userId: session.user.id },
      include: {
        event: {
          include: {
            _count: { select: { attendees: { where: { leftAt: null } } } },
          },
        },
      },
    })

    // Promote waitlists in case any events have started
    await Promise.all(rows.map((r) => promoteWaitlist(r.eventId)))

    // Re-fetch after promotion so we only return events where user is still waitlisted
    const refreshed = await prisma.eventWaitlist.findMany({
      where: { userId: session.user.id },
      include: {
        event: {
          include: {
            _count: { select: { attendees: { where: { leftAt: null } } } },
          },
        },
      },
    })

    return refreshed.map((r) => r.event)
  })

export const getEventWaitlist = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: eventId }) => {
    const session = await requireSession()

    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) throw new Error('Event not found')

    const isCreator = event.createdById === session.user.id
    const isWaitlisted = await prisma.eventWaitlist.findUnique({
      where: { eventId_userId: { eventId, userId: session.user.id } },
    })

    if (!isCreator && !isWaitlisted) {
      throw new Error('Unauthorized')
    }

    await promoteWaitlist(eventId)

    const rows = await prisma.eventWaitlist.findMany({
      where: { eventId },
      orderBy: { joinedAt: 'asc' },
      select: { userId: true, joinedAt: true },
    })

    if (rows.length === 0) return []

    const userIds = rows.map((r) => r.userId)
    const [profiles, users] = await Promise.all([
      prisma.profile.findMany({ where: { userId: { in: userIds } } }),
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, image: true, email: true, disabledAt: true },
      }),
    ])

    const userById = new Map(users.map((u) => [u.id, u]))
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]))

    const activeUserIds = userIds.filter((id) => !userById.get(id)?.disabledAt)

    return activeUserIds.map((userId) => {
      const profile = profileByUserId.get(userId)
      const user = userById.get(userId)
      const row = rows.find((r) => r.userId === userId)!
      return {
        userId,
        joinedAt: row.joinedAt,
        name: profile?.name || user?.name || user?.email?.split('@')[0] || 'Unnamed',
        photo: profile?.photos?.[0] || user?.image || null,
      }
    })
  })

export const removeFromWaitlist = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ eventId: z.string(), userId: z.string().optional() }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    const targetUserId = data.userId || session.user.id

    if (targetUserId !== session.user.id) {
      const event = await prisma.event.findUnique({ where: { id: data.eventId } })
      if (!event) throw new Error('Event not found')
      if (event.createdById !== session.user.id) throw new Error('Unauthorized')
    }

    await prisma.eventWaitlist.deleteMany({
      where: { eventId: data.eventId, userId: targetUserId },
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
    const [profiles, users] = await Promise.all([
      prisma.profile.findMany({ where: { userId: { in: userIds } } }),
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, disabledAt: true },
      }),
    ])

    const userById = new Map(users.map((u) => [u.id, u]))
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]))

    const activeUserIds = new Set(
      userIds.filter((id) => !userById.get(id)?.disabledAt)
    )

    return reports
      .filter((r) => activeUserIds.has(r.reporterId) && activeUserIds.has(r.reportedId))
      .map((r) => ({
        ...r,
        reporter: profileByUserId.get(r.reporterId),
        reported: profileByUserId.get(r.reportedId),
      }))
  })
