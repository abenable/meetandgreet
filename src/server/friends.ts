import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '#/db'
import { requireSession } from '#/server/auth'
import { createNotification } from './notifications.server'
import { rateLimit } from '#/lib/rate-limit'
import { getUserScopedIdentifier } from '#/lib/rate-limit.server'

const requestRateLimit = rateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 60 })
const respondRateLimit = rateLimit({ windowMs: 60 * 1000, maxRequests: 30 })

export type FriendState =
  | 'none'
  | 'outgoing'
  | 'incoming'
  | 'friends'
  | 'blocked'

const PERSON_SELECT = {
  id: true,
  name: true,
  image: true,
  email: true,
  disabledAt: true,
  lastActiveDate: true,
  profile: {
    select: {
      name: true,
      photos: true,
      location: true,
      bio: true,
      verifiedAt: true,
      showOnlineStatus: true,
    },
  },
} as const

type PersonRow = {
  id: string
  name: string | null
  image: string | null
  email: string | null
  lastActiveDate: Date | null
  profile: {
    name: string | null
    photos: string[]
    location: string | null
    bio: string | null
    verifiedAt: Date | null
    showOnlineStatus: boolean
  } | null
}

export interface FriendPerson {
  userId: string
  name: string
  photo: string | null
  location: string
  bio: string
  verifiedAt: Date | null
  lastActiveDate: Date | null
}

function toPerson(user: PersonRow): FriendPerson {
  const photos = user.profile?.photos?.length ? user.profile.photos : user.image ? [user.image] : []
  return {
    userId: user.id,
    name: user.profile?.name || user.name || user.email?.split('@')[0] || 'Unnamed',
    photo: photos[0] ?? null,
    location: user.profile?.location ?? '',
    bio: user.profile?.bio ?? '',
    verifiedAt: user.profile?.verifiedAt ?? null,
    lastActiveDate: user.profile?.showOnlineStatus === false ? null : (user.lastActiveDate ?? null),
  }
}

async function getBlockedIds(myId: string): Promise<Set<string>> {
  const rows = await prisma.userBlock.findMany({
    where: { OR: [{ blockerId: myId }, { blockedId: myId }] },
    select: { blockerId: true, blockedId: true },
  })
  return new Set(rows.map((r) => (r.blockerId === myId ? r.blockedId : r.blockerId)))
}

function pairWhere(a: string, b: string) {
  return {
    OR: [
      { requesterId: a, addresseeId: b },
      { requesterId: b, addresseeId: a },
    ],
  }
}

export const sendFriendRequest = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    const myId = session.user.id

    if (myId === data.userId) throw new Error('You cannot add yourself')

    const throttle = await requestRateLimit(getUserScopedIdentifier(myId))
    if (!throttle.success) throw new Error('Too many requests. Please slow down.')

    const [target, blocked, existing] = await Promise.all([
      prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true, disabledAt: true },
      }),
      prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: myId, blockedId: data.userId },
            { blockerId: data.userId, blockedId: myId },
          ],
        },
        select: { id: true },
      }),
      prisma.friendship.findFirst({ where: pairWhere(myId, data.userId) }),
    ])

    if (!target || target.disabledAt || blocked) {
      throw new Error('This profile is no longer available')
    }

    if (existing) {
      if (existing.status === 'accepted') {
        return { state: 'friends' as FriendState }
      }
      if (existing.addresseeId === myId) {
        await prisma.friendship.update({
          where: { id: existing.id },
          data: { status: 'accepted', respondedAt: new Date() },
        })
        await notifyAccepted(existing.requesterId, myId)
        return { state: 'friends' as FriendState }
      }
      return { state: 'outgoing' as FriendState }
    }

    const myProfile = await prisma.profile.findUnique({
      where: { userId: myId },
      select: { name: true },
    })

    await prisma.friendship.create({
      data: { requesterId: myId, addresseeId: data.userId, status: 'pending' },
    })

    await createNotification({
      userId: data.userId,
      type: 'friend_request',
      title: 'New friend request',
      body: `${myProfile?.name ?? 'Someone'} wants to be friends`,
      link: '/friends',
    })

    return { state: 'outgoing' as FriendState }
  })

async function notifyAccepted(toUserId: string, byUserId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId: byUserId },
    select: { name: true },
  })
  await createNotification({
    userId: toUserId,
    type: 'friend_accepted',
    title: 'You have a new friend',
    body: `${profile?.name ?? 'Someone'} accepted your friend request`,
    link: '/friends',
  })
}

export const respondToFriendRequest = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      userId: z.string().min(1),
      action: z.enum(['accept', 'decline']),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireSession()
    const myId = session.user.id

    const throttle = await respondRateLimit(getUserScopedIdentifier(myId))
    if (!throttle.success) throw new Error('Too many actions. Please slow down.')

    const request = await prisma.friendship.findFirst({
      where: { requesterId: data.userId, addresseeId: myId, status: 'pending' },
    })
    if (!request) return { state: 'none' as FriendState }

    if (data.action === 'decline') {
      await prisma.friendship.delete({ where: { id: request.id } })
      return { state: 'none' as FriendState }
    }

    await prisma.friendship.update({
      where: { id: request.id },
      data: { status: 'accepted', respondedAt: new Date() },
    })
    await notifyAccepted(data.userId, myId)
    return { state: 'friends' as FriendState }
  })

export const cancelFriendRequest = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    const myId = session.user.id

    await prisma.friendship.deleteMany({
      where: { requesterId: myId, addresseeId: data.userId, status: 'pending' },
    })
    return { state: 'none' as FriendState }
  })

export const removeFriend = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    const myId = session.user.id

    await prisma.friendship.deleteMany({
      where: { ...pairWhere(myId, data.userId), status: 'accepted' },
    })
    return { state: 'none' as FriendState }
  })

export const listFriends = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ query: z.string().max(80).optional() }).optional())
  .handler(async ({ data }) => {
    const session = await requireSession()
    const myId = session.user.id

    const rows = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: myId }, { addresseeId: myId }],
        status: 'accepted',
      },
      select: { requesterId: true, addresseeId: true, respondedAt: true, createdAt: true },
    })

    const peerIds = rows.map((r) => (r.requesterId === myId ? r.addresseeId : r.requesterId))
    if (peerIds.length === 0) return []

    const blocked = await getBlockedIds(myId)
    const users = await prisma.user.findMany({
      where: { id: { in: peerIds }, disabledAt: null },
      select: PERSON_SELECT,
    })

    const since = new Map(
      rows.map((r) => [
        r.requesterId === myId ? r.addresseeId : r.requesterId,
        r.respondedAt ?? r.createdAt,
      ]),
    )

    const q = data?.query?.trim().toLowerCase() ?? ''

    return users
      .filter((u) => !blocked.has(u.id))
      .map((u) => ({ ...toPerson(u as PersonRow), friendsSince: since.get(u.id) ?? null }))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q))
      .sort((a, b) => (b.lastActiveDate?.getTime() ?? 0) - (a.lastActiveDate?.getTime() ?? 0))
  })

export const listFriendRequests = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()
    const myId = session.user.id

    const [incomingRows, outgoingRows, blocked] = await Promise.all([
      prisma.friendship.findMany({
        where: { addresseeId: myId, status: 'pending' },
        orderBy: { createdAt: 'desc' },
        select: { requesterId: true, createdAt: true },
      }),
      prisma.friendship.findMany({
        where: { requesterId: myId, status: 'pending' },
        orderBy: { createdAt: 'desc' },
        select: { addresseeId: true, createdAt: true },
      }),
      getBlockedIds(myId),
    ])

    const ids = [
      ...incomingRows.map((r) => r.requesterId),
      ...outgoingRows.map((r) => r.addresseeId),
    ]
    if (ids.length === 0) return { incoming: [], outgoing: [] }

    const users = await prisma.user.findMany({
      where: { id: { in: ids }, disabledAt: null },
      select: PERSON_SELECT,
    })
    const byId = new Map(users.map((u) => [u.id, toPerson(u as PersonRow)]))

    const hydrate = <T extends { createdAt: Date }>(rows: T[], idOf: (row: T) => string) =>
      rows
        .map((row) => {
          const person = byId.get(idOf(row))
          return person ? { ...person, requestedAt: row.createdAt } : null
        })
        .filter((p): p is FriendPerson & { requestedAt: Date } => !!p && !blocked.has(p.userId))

    return {
      incoming: hydrate(incomingRows, (r) => r.requesterId),
      outgoing: hydrate(outgoingRows, (r) => r.addresseeId),
    }
  })

export const getPendingRequestCount = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()
    return prisma.friendship.count({
      where: { addresseeId: session.user.id, status: 'pending' },
    })
  })

export const searchPeople = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ query: z.string().max(80) }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    const myId = session.user.id
    const q = data.query.trim()
    if (q.length < 2) return []

    const blocked = await getBlockedIds(myId)

    const profiles = await prisma.profile.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
        userId: { not: myId, notIn: [...blocked] },
        user: { disabledAt: null },
      },
      select: { userId: true },
      take: 30,
    })

    const ids = profiles.map((p) => p.userId)
    if (ids.length === 0) return []

    const [users, friendships] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: ids } }, select: PERSON_SELECT }),
      prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: myId, addresseeId: { in: ids } },
            { addresseeId: myId, requesterId: { in: ids } },
          ],
        },
        select: { requesterId: true, addresseeId: true, status: true },
      }),
    ])

    const stateById = new Map<string, FriendState>()
    for (const f of friendships) {
      const peer = f.requesterId === myId ? f.addresseeId : f.requesterId
      stateById.set(
        peer,
        f.status === 'accepted' ? 'friends' : f.requesterId === myId ? 'outgoing' : 'incoming',
      )
    }

    return users.map((u) => ({
      ...toPerson(u as PersonRow),
      state: stateById.get(u.id) ?? ('none' as FriendState),
    }))
  })

export const getFriendStates = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ userIds: z.array(z.string()).max(100) }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    const myId = session.user.id
    if (data.userIds.length === 0) return {} as Record<string, FriendState>

    const rows = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: myId, addresseeId: { in: data.userIds } },
          { addresseeId: myId, requesterId: { in: data.userIds } },
        ],
      },
      select: { requesterId: true, addresseeId: true, status: true },
    })

    const out: Record<string, FriendState> = {}
    for (const id of data.userIds) out[id] = 'none'
    for (const f of rows) {
      const peer = f.requesterId === myId ? f.addresseeId : f.requesterId
      out[peer] =
        f.status === 'accepted' ? 'friends' : f.requesterId === myId ? 'outgoing' : 'incoming'
    }
    return out
  })
