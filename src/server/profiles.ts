import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'

export const getMyProfile = createServerFn({ method: 'GET' })
  .handler(async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) return null

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return prisma.profile.create({
        data: {
          userId: session.user.id,
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

export const updateProfile = createServerFn({ method: 'POST' })
  .validator(z.object({
    bio: z.string().max(500).optional(),
    photos: z.array(z.string().url()).max(6).optional(),
    gender: z.string().max(50).optional(),
    location: z.string().max(200).optional(),
    interests: z.array(z.string().max(50)).max(20).optional(),
    job: z.string().max(200).optional(),
  }))
  .handler(async ({ request, data }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) throw new Error('Unauthorized')

    return prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        bio: data.bio,
        photos: data.photos,
        gender: data.gender,
        location: data.location,
        interests: data.interests,
      },
      create: {
        userId: session.user.id,
        bio: data.bio ?? '',
        photos: data.photos ?? [],
        gender: data.gender ?? '',
        location: data.location ?? '',
        interests: data.interests ?? [],
      },
    })
  })
