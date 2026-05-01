import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getRequest } from '@tanstack/react-start/server'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'
import { createNotification } from './notifications.server'

async function requireSession() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session
}

export const recordSwipe = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    eventId: z.string(),
    swipedId: z.string(),
    direction: z.enum(['like', 'pass', 'super']),
  }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    const swiperId = session.user.id

    if (swiperId === data.swipedId) {
      throw new Error('Cannot swipe yourself')
    }

    const [swiperAttendee, swipedAttendee] = await Promise.all([
      prisma.eventAttendee.findFirst({
        where: { eventId: data.eventId, userId: swiperId, leftAt: null },
      }),
      prisma.eventAttendee.findFirst({
        where: { eventId: data.eventId, userId: data.swipedId, leftAt: null },
      }),
    ])

    if (!swiperAttendee || !swipedAttendee) {
      throw new Error('Both users must be active attendees of the event')
    }

    const swipe = await prisma.eventSwipe.upsert({
      where: {
        eventId_swiperId_swipedId: {
          eventId: data.eventId,
          swiperId,
          swipedId: data.swipedId,
        },
      },
      update: { direction: data.direction },
      create: {
        eventId: data.eventId,
        swiperId,
        swipedId: data.swipedId,
        direction: data.direction,
      },
    })

    if (data.direction === 'like' || data.direction === 'super') {
      const [mutual, swiperProfile] = await Promise.all([
        prisma.eventSwipe.findFirst({
          where: {
            eventId: data.eventId,
            swiperId: data.swipedId,
            swipedId: swiperId,
            direction: { in: ['like', 'super'] },
          },
        }),
        prisma.profile.findUnique({ where: { userId: swiperId }, select: { name: true } }),
      ])

      if (mutual) {
        const [u1, u2] = [swiperId, data.swipedId].sort()
        const existingMatch = await prisma.eventMatch.findFirst({
          where: { eventId: data.eventId, user1Id: u1, user2Id: u2 },
        })

        if (!existingMatch) {
          const match = await prisma.eventMatch.create({
            data: {
              eventId: data.eventId,
              user1Id: u1,
              user2Id: u2,
            },
          })
          // Notify both users about the match
          await Promise.all([
            createNotification({
              userId: swiperId,
              type: 'match',
              title: "It's a Match!",
              body: 'You matched with someone. Start chatting!',
              link: `/matches/${match.id}`,
            }),
            createNotification({
              userId: data.swipedId,
              type: 'match',
              title: "It's a Match!",
              body: 'You matched with someone. Start chatting!',
              link: `/matches/${match.id}`,
            }),
          ])
          return match
        }
        return existingMatch
      }

      // Not mutual yet — notify the swiped user they got a like
      await createNotification({
        userId: data.swipedId,
        type: 'like',
        title: 'New Like',
        body: `${swiperProfile?.name ?? 'Someone'} liked you`,
        link: '/likes',
      })
    }

    return swipe
  })

export const getLikes = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()

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
  .handler(async () => {
    const session = await requireSession()

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
  .handler(async ({ data: matchId }) => {
    const session = await requireSession()

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
  .handler(async ({ data }) => {
    const session = await requireSession()

    const match = await prisma.eventMatch.findFirst({
      where: {
        id: data.matchId,
        OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
      },
    })
    if (!match) throw new Error('Match not found')

    const peerId = match.user1Id === session.user.id ? match.user2Id : match.user1Id
    await createNotification({
      userId: peerId,
      type: 'message',
      title: 'New Message',
      body: data.content.slice(0, 100),
      link: `/matches/${data.matchId}`,
    })

    return prisma.eventMessage.create({
      data: {
        matchId: data.matchId,
        senderId: session.user.id,
        content: data.content,
      },
    })
  })
