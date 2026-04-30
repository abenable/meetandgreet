import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'

export const recordSwipe = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    eventId: z.string(),
    swipedId: z.string(),
    direction: z.enum(['like', 'pass', 'super']),
  }))
  .handler(async ({ request, data }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) throw new Error('Unauthorized')

    const swipe = await prisma.eventSwipe.create({
      data: {
        eventId: data.eventId,
        swiperId: session.user.id,
        swipedId: data.swipedId,
        direction: data.direction,
      },
    })

    // Check for mutual like (match)
    if (data.direction === 'like' || data.direction === 'super') {
      const mutual = await prisma.eventSwipe.findFirst({
        where: {
          eventId: data.eventId,
          swiperId: data.swipedId,
          swipedId: session.user.id,
          direction: { in: ['like', 'super'] },
        },
      })

      if (mutual) {
        const [u1, u2] = [session.user.id, data.swipedId].sort()
        const existingMatch = await prisma.eventMatch.findFirst({
          where: { eventId: data.eventId, user1Id: u1, user2Id: u2 },
        })

        if (!existingMatch) {
          return prisma.eventMatch.create({
            data: {
              eventId: data.eventId,
              user1Id: u1,
              user2Id: u2,
            },
          })
        }
        return existingMatch
      }
    }

    return swipe
  })

export const getLikes = createServerFn({ method: 'GET' })
  .handler(async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) return []

    const activeAttendee = await prisma.eventAttendee.findFirst({
      where: { userId: session.user.id, leftAt: null },
    })
    if (!activeAttendee) return []

    const swipes = await prisma.eventSwipe.findMany({
      where: {
        eventId: activeAttendee.eventId,
        swipedId: session.user.id,
        direction: { in: ['like', 'super'] },
      },
    })

    if (swipes.length === 0) return []

    const swiperIds = swipes.map((s) => s.swiperId)
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: swiperIds } },
    })

    return profiles
  })

export const getMatches = createServerFn({ method: 'GET' })
  .handler(async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) return []

    const matches = await prisma.eventMatch.findMany({
      where: {
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id },
        ],
      },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })

    const peerIds = matches.map((m) =>
      m.user1Id === session.user.id ? m.user2Id : m.user1Id
    )

    const profiles = await prisma.profile.findMany({
      where: { userId: { in: peerIds } },
    })

    return matches.map((match) => {
      const peerId = match.user1Id === session.user.id ? match.user2Id : match.user1Id
      const profile = profiles.find((p) => p.userId === peerId)
      return {
        id: match.id,
        eventId: match.eventId,
        peerId,
        peerName: profile?.name ?? 'Unknown',
        peerPhoto: profile?.photos[0],
        lastMessage: match.messages[0]?.content ?? '',
        lastMessageAt: match.messages[0]?.createdAt ?? match.createdAt,
        unread: 0,
      }
    })
  })

export const getMessages = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ request, data: matchId }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) return []

    const match = await prisma.eventMatch.findFirst({
      where: {
        id: matchId,
        OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
      },
    })
    if (!match) return []

    return prisma.eventMessage.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
    })
  })

export const sendMessage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    matchId: z.string(),
    content: z.string().min(1).max(2000),
  }))
  .handler(async ({ request, data }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) throw new Error('Unauthorized')

    const match = await prisma.eventMatch.findFirst({
      where: {
        id: data.matchId,
        OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
      },
    })
    if (!match) throw new Error('Match not found')

    return prisma.eventMessage.create({
      data: {
        matchId: data.matchId,
        senderId: session.user.id,
        content: data.content,
      },
    })
  })
