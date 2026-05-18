import { prisma } from '#/db'
import { requireSession } from '#/server/auth'

export async function isBlockedByUser(userId: string): Promise<boolean> {
  const session = await requireSession()
  const myId = session.user.id

  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: myId, blockedId: userId },
        { blockerId: userId, blockedId: myId },
      ],
    },
  })

  return !!block
}
