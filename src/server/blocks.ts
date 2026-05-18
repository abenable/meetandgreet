import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '#/db'
import { requireSession } from '#/server/auth'

export const blockUser = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: userId }) => {
    const session = await requireSession()
    const blockerId = session.user.id

    if (blockerId === userId) {
      throw new Error('Cannot block yourself')
    }

    await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: userId,
        },
      },
      update: {},
      create: {
        blockerId,
        blockedId: userId,
      },
    })

    return { success: true }
  })

export const unblockUser = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: userId }) => {
    const session = await requireSession()
    const blockerId = session.user.id

    await prisma.userBlock.deleteMany({
      where: {
        blockerId,
        blockedId: userId,
      },
    })

    return { success: true }
  })

export const getBlockedUsers = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()

    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: session.user.id },
      select: { blockedId: true, createdAt: true },
    })

    const blockedIds = blocks.map((b) => b.blockedId)
    if (blockedIds.length === 0) return []

    const [profiles, users] = await Promise.all([
      prisma.profile.findMany({ where: { userId: { in: blockedIds } } }),
      prisma.user.findMany({
        where: { id: { in: blockedIds } },
        select: { id: true, name: true, image: true, disabledAt: true },
      }),
    ])

    const userById = new Map(users.map((u) => [u.id, u]))
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]))

    return blocks
      .filter((b) => !userById.get(b.blockedId)?.disabledAt)
      .map((b) => {
        const profile = profileByUserId.get(b.blockedId)
        const user = userById.get(b.blockedId)
        return {
          userId: b.blockedId,
          blockedAt: b.createdAt,
          name: profile?.name || user?.name || 'Unknown',
          photo: profile?.photos?.[0] || user?.image || null,
        }
      })
  })
