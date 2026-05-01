import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'
import { requireSession } from '#/server/auth'

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

    // 3. Fetch all peer profiles
    const allPeerIds = [...new Set([...matchPeerIds, ...organizerPeerIds])]
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: allPeerIds } },
    })

    // Build match conversation list
    const matchConversations = matches.map((match) => {
      const peerId = match.user1Id === myId ? match.user2Id : match.user1Id
      const profile = profiles.find((p) => p.userId === peerId)
      return {
        id: `match:${match.id}`,
        type: 'match' as const,
        matchId: match.id,
        eventId: match.eventId,
        peerId,
        peerName: profile?.name ?? 'Unknown',
        peerPhoto: profile?.photos[0],
        lastMessage: match.messages[0]?.content ?? 'New match!',
        lastMessageAt: match.messages[0]?.createdAt ?? match.createdAt,
        unreadCount: 0,
      }
    })

    // Build organizer conversation list
    const organizerConversations = [...organizerConvoMap.values()].map((convo) => {
      const profile = profiles.find((p) => p.userId === convo.peerId)
      const event = events.find((e) => e.id === convo.eventId)
      return {
        id: `org:${convo.eventId}:${convo.peerId}`,
        type: 'organizer' as const,
        eventId: convo.eventId,
        eventName: event?.name ?? 'Event',
        peerId: convo.peerId,
        peerName: profile?.name ?? 'Unknown',
        peerPhoto: profile?.photos[0],
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
