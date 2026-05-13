import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '#/db'
import { requireSession } from '#/server/auth'
import { createNotification } from './notifications.server'
import { broadcastChatMessage } from './websocket-broadcast'

export const getConversations = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()
    const myId = session.user.id

    // 1. Match conversations
    const matches = await prisma.eventMatch.findMany({
      where: {
        OR: [{ user1Id: myId }, { user2Id: myId }],
      },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })

    const matchPeerIds = matches.map((m) =>
      m.user1Id === myId ? m.user2Id : m.user1Id
    )

    // 2. Organizer conversations (messages where I'm sender or receiver)
    const organizerMsgs = await prisma.eventOrganizerMessage.findMany({
      where: {
        OR: [{ senderId: myId }, { receiverId: myId }],
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group organizer messages by eventId + peerId
    const organizerConvoMap = new Map<string, {
      eventId: string
      peerId: string
      lastMessage: typeof organizerMsgs[0]
      unreadCount: number
    }>()

    for (const msg of organizerMsgs) {
      const peerId = msg.senderId === myId ? msg.receiverId : msg.senderId
      const key = `${msg.eventId}:${peerId}`
      const existing = organizerConvoMap.get(key)
      if (!existing) {
        organizerConvoMap.set(key, {
          eventId: msg.eventId,
          peerId,
          lastMessage: msg,
          unreadCount: msg.receiverId === myId && !msg.readAt ? 1 : 0,
        })
      } else {
        if (msg.receiverId === myId && !msg.readAt) {
          existing.unreadCount++
        }
      }
    }

    const organizerPeerIds = [...organizerConvoMap.values()].map((c) => c.peerId)
    const eventIds = [...new Set([...organizerConvoMap.values()].map((c) => c.eventId))]

    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, name: true },
    })

    // 3. Fetch all peer profiles and users for fallback photos/names
    const allPeerIds = [...new Set([...matchPeerIds, ...organizerPeerIds])]
    const [profiles, users] = await Promise.all([
      prisma.profile.findMany({ where: { userId: { in: allPeerIds } } }),
      prisma.user.findMany({
        where: { id: { in: allPeerIds } },
        select: { id: true, name: true, image: true, disabledAt: true },
      }),
    ])

    const userById = new Map(users.map((u) => [u.id, u]))
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]))

    const activePeerIds = new Set(
      allPeerIds.filter((id) => !userById.get(id)?.disabledAt)
    )

    const getPeerPhoto = (peerId: string) => {
      const profile = profileByUserId.get(peerId)
      const user = userById.get(peerId)
      if (profile?.photos && profile.photos.length > 0) return profile.photos[0]
      return user?.image
    }

    const getPeerName = (peerId: string) => {
      const profile = profileByUserId.get(peerId)
      const user = userById.get(peerId)
      return profile?.name || user?.name || 'Unknown'
    }

    // Build match conversation list
    const matchConversations = matches
      .filter((match) => {
        const peerId = match.user1Id === myId ? match.user2Id : match.user1Id
        return activePeerIds.has(peerId)
      })
      .map((match) => {
        const peerId = match.user1Id === myId ? match.user2Id : match.user1Id
        return {
          id: `${match.id}`,
          chatId: `match_${match.id}`,
          type: 'match' as const,
          matchId: match.id,
          eventId: match.eventId,
          peerId,
          peerName: getPeerName(peerId),
          peerPhoto: getPeerPhoto(peerId),
          lastMessage: match.messages[0]?.content ?? 'New match!',
          lastMessageAt: match.messages[0]?.createdAt ?? match.createdAt,
          unreadCount: 0,
        }
      })

    // Build organizer conversation list
    const organizerConversations = [...organizerConvoMap.values()]
      .filter((convo) => activePeerIds.has(convo.peerId))
      .map((convo) => {
        const event = events.find((e) => e.id === convo.eventId)
        return {
          id: `${convo.eventId}:${convo.peerId}`,
          chatId: `org_${convo.eventId}_${convo.peerId}`,
        type: 'organizer' as const,
        eventId: convo.eventId,
        eventName: event?.name ?? 'Event',
        peerId: convo.peerId,
        peerName: getPeerName(convo.peerId),
        peerPhoto: getPeerPhoto(convo.peerId),
        lastMessage: convo.lastMessage.content,
        lastMessageAt: convo.lastMessage.createdAt,
        unreadCount: convo.unreadCount,
      }
    })

    // Combine and sort by most recent message
    const all = [...matchConversations, ...organizerConversations]
    all.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

    return all
  })

// ── Unified Chat API ──

export const getChatMessages = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: chatId }) => {
    const session = await requireSession()
    const myId = session.user.id

    if (chatId.startsWith('match_')) {
      const matchId = chatId.slice('match_'.length)
      const match = await prisma.eventMatch.findFirst({
        where: { id: matchId, OR: [{ user1Id: myId }, { user2Id: myId }] },
      })
      if (!match) throw new Error('Match not found')

      const msgs = await prisma.eventMessage.findMany({
        where: { matchId },
        orderBy: { createdAt: 'asc' },
      })

      return {
        type: 'match' as const,
        peerId: match.user1Id === myId ? match.user2Id : match.user1Id,
        messages: msgs.map((m) => ({ ...m, isMine: m.senderId === myId })),
      }
    }

    if (chatId.startsWith('org_')) {
      const [, eventId, peerId] = chatId.split('_')
      if (!eventId || !peerId) throw new Error('Invalid chat id')

      const event = await prisma.event.findUnique({ where: { id: eventId } })
      if (!event) throw new Error('Event not found')

      const [meAttendee, peerAttendee] = await Promise.all([
        prisma.eventAttendee.findFirst({ where: { eventId, userId: myId, leftAt: null } }),
        prisma.eventAttendee.findFirst({ where: { eventId, userId: peerId, leftAt: null } }),
      ])

      if (!meAttendee) throw new Error('You must be attending this event')
      if (!peerAttendee) throw new Error('The other user is not attending this event')

      const msgs = await prisma.eventOrganizerMessage.findMany({
        where: {
          eventId,
          OR: [
            { senderId: myId, receiverId: peerId },
            { senderId: peerId, receiverId: myId },
          ],
        },
        orderBy: { createdAt: 'asc' },
      })

      return {
        type: 'organizer' as const,
        peerId,
        eventId,
        messages: msgs.map((m) => ({ ...m, isMine: m.senderId === myId })),
      }
    }

    throw new Error('Unknown chat type')
  })

export const sendChatMessage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    chatId: z.string(),
    content: z.string().min(1).max(2000),
  }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    const myId = session.user.id
    const { chatId, content } = data

    if (chatId.startsWith('match_')) {
      const matchId = chatId.slice('match_'.length)
      const match = await prisma.eventMatch.findFirst({
        where: { id: matchId, OR: [{ user1Id: myId }, { user2Id: myId }] },
      })
      if (!match) throw new Error('Match not found')

      const peerId = match.user1Id === myId ? match.user2Id : match.user1Id
      const message = await prisma.eventMessage.create({
        data: { matchId, senderId: myId, content },
      })

      // Broadcast WebSocket message for instant delivery
      broadcastChatMessage(chatId, { ...message, isMine: false }, peerId)

      await createNotification({
        userId: peerId,
        type: 'message',
        title: 'New Message',
        body: content.slice(0, 100),
        link: `/chats/${chatId}`,
      })

      return { ...message, isMine: true }
    }

    if (chatId.startsWith('org_')) {
      const [, eventId, peerId] = chatId.split('_')
      if (!eventId || !peerId) throw new Error('Invalid chat id')

      const event = await prisma.event.findUnique({ where: { id: eventId } })
      if (!event) throw new Error('Event not found')

      const [meAttendee, peerAttendee] = await Promise.all([
        prisma.eventAttendee.findFirst({ where: { eventId, userId: myId, leftAt: null } }),
        prisma.eventAttendee.findFirst({ where: { eventId, userId: peerId, leftAt: null } }),
      ])

      if (!meAttendee) throw new Error('You must be attending this event')
      if (!peerAttendee) throw new Error('The other user is not attending this event')

      const message = await prisma.eventOrganizerMessage.create({
        data: { eventId, senderId: myId, receiverId: peerId, content },
      })

      // Broadcast WebSocket message for instant delivery
      broadcastChatMessage(chatId, { ...message, isMine: false }, peerId)

      await createNotification({
        userId: peerId,
        type: 'message',
        title: 'New Message',
        body: content.slice(0, 100),
        link: `/chats/${chatId}`,
      })

      return { ...message, isMine: true }
    }

    throw new Error('Unknown chat type')
  })

export const markChatRead = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: chatId }) => {
    const session = await requireSession()
    const myId = session.user.id

    if (chatId.startsWith('match_')) {
      // Match messages don't have readAt yet; nothing to mark
      return { success: true }
    }

    if (chatId.startsWith('org_')) {
      const [, eventId, peerId] = chatId.split('_')
      if (!eventId || !peerId) throw new Error('Invalid chat id')

      await prisma.eventOrganizerMessage.updateMany({
        where: {
          eventId,
          senderId: peerId,
          receiverId: myId,
          readAt: null,
        },
        data: { readAt: new Date() },
      })

      return { success: true }
    }

    throw new Error('Unknown chat type')
  })
