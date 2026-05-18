import { prisma } from '#/db'
import webPush from 'web-push'

webPush.setVapidDetails(
  'mailto:admin@meetandgreet.tech',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || '',
)

export async function createNotification(data: {
  userId: string
  type: 'like' | 'match' | 'message' | 'request' | 'request_accepted'
  title: string
  body: string
  link?: string
}) {
  const notification = await prisma.notification.create({ data })

  // Also send push notification to the user's devices
  await sendPushNotification(data.userId, {
    title: data.title,
    body: data.body,
    url: data.link,
  })

  return notification
}

export async function sendPushNotification(
  userId: string,
  payload: {
    title: string
    body: string
    icon?: string
    url?: string
  }
) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys not configured, skipping push notification')
    return
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (subs.length === 0) return

  const pushPayload = JSON.stringify(payload)

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          pushPayload,
        )
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired or invalid — remove it
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
        } else {
          console.error('[Push] Failed to send notification:', error)
        }
      }
    }),
  )
}
