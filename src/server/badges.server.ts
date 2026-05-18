import { prisma } from '#/db'
import { createNotification } from './notifications.server'

const BADGE_NOTIFICATIONS: Record<string, { title: string; body: string }> = {
  first_match: { title: 'New Badge!', body: 'You earned the First Match badge!' },
  streak_3: { title: 'New Badge!', body: '3-day streak! Keep it going!' },
  streak_7: { title: 'New Badge!', body: '7-day streak! You are on fire!' },
  social_butterfly: { title: 'New Badge!', body: 'Social Butterfly! You joined 3 events!' },
  event_host: { title: 'New Badge!', body: 'Event Host! You created your first event!' },
}

export async function awardBadgeIfNotExists(userId: string, type: string): Promise<{ earned: boolean }> {
  const existing = await prisma.userBadge.findUnique({
    where: { userId_type: { userId, type } },
  })
  if (existing) return { earned: false }
  await prisma.userBadge.create({ data: { userId, type } })
  
  const info = BADGE_NOTIFICATIONS[type]
  if (info) {
    createNotification({
      userId,
      type: 'request_accepted',
      title: info.title,
      body: info.body,
      link: '/profile',
    }).catch(() => {})
  }
  
  return { earned: true }
}
