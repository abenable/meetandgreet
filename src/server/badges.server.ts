import { prisma } from '#/db'

export async function awardBadgeIfNotExists(userId: string, type: string): Promise<{ earned: boolean }> {
  const existing = await prisma.userBadge.findUnique({
    where: { userId_type: { userId, type } },
  })
  if (existing) return { earned: false }
  await prisma.userBadge.create({ data: { userId, type } })
  return { earned: true }
}
