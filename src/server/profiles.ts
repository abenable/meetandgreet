import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '#/db'
import { requireSession } from '#/server/auth'
import { sanitizeProfile } from '#/lib/sanitize'

export const getMyProfile = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await requireSession()

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return prisma.profile.create({
        data: {
          userId: session.user.id,
          name: session.user.name || session.user.email.split('@')[0],
          bio: '',
          photos: [],
          gender: '',
          location: '',
          interests: [],
        },
      })
    }

    return profile
  })

export const getProfileByUserId = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: userId }) => {
    await requireSession()
    return prisma.profile.findUnique({ where: { userId } })
  })

export const updateProfile = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    bio: z.string().max(500).optional(),
    photos: z.array(z.string()).max(6).optional(),
    name: z.string().max(100).optional(),
    gender: z.string().max(50).optional(),
    birthDate: z.string().optional(),
    location: z.string().max(200).optional(),
    interests: z.array(z.string().max(50)).max(20).optional(),
    job: z.string().max(200).optional(),
  }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    const sanitized = sanitizeProfile(data)

    return prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        ...(sanitized.bio !== undefined && { bio: sanitized.bio }),
        ...(data.photos !== undefined && { photos: data.photos }),
        ...(sanitized.name !== undefined && { name: sanitized.name }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
        ...(sanitized.location !== undefined && { location: sanitized.location }),
        ...(sanitized.interests !== undefined && { interests: sanitized.interests }),
        ...(sanitized.job !== undefined && { job: sanitized.job }),
      },
      create: {
        userId: session.user.id,
        name: sanitized.name || session.user.name || session.user.email.split('@')[0],
        bio: sanitized.bio ?? '',
        photos: data.photos ?? [],
        gender: data.gender ?? '',
        location: sanitized.location ?? '',
        interests: sanitized.interests ?? [],
      },
    })
  })
