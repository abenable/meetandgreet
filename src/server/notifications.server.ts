import { prisma } from '#/db'

export async function createNotification(data: {
  userId: string
  type: 'like' | 'match' | 'message' | 'organizer_message'
  title: string
  body: string
  link?: string
}) {
  return prisma.notification.create({ data })
}
