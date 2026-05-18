import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '#/db'
import { requireSession } from '#/server/auth'

export const getNotifications = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()
    return prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  })

export const getUnreadNotificationCount = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()
    return prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    })
  })

export const markNotificationRead = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    const session = await requireSession()
    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { readAt: new Date() },
    })
    return { success: true }
  })

export const markAllNotificationsRead = createServerFn({ method: 'POST' })
  .handler(async () => {
    const session = await requireSession()
    await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    })
    return { success: true }
  })

export const getVapidPublicKey = createServerFn({ method: 'GET' })
  .handler(async () => {
    return process.env.VAPID_PUBLIC_KEY || null
  })

export const subscribePush = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      endpoint: z.string(),
      p256dh: z.string(),
      auth: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireSession()
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: session.user.id,
          endpoint: data.endpoint,
        },
      },
      update: {
        p256dh: data.p256dh,
        auth: data.auth,
      },
      create: {
        userId: session.user.id,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
      },
    })
    return { success: true }
  })

export const unsubscribePush = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      endpoint: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireSession()
    await prisma.pushSubscription.deleteMany({
      where: { userId: session.user.id, endpoint: data.endpoint },
    })
    return { success: true }
  })
