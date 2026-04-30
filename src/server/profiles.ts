import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getRequest } from '@tanstack/react-start/server'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'

async function requireSession() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session
}

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

export const updateProfile = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    bio: z.string().max(500).optional(),
    photos: z.array(z.string().url()).max(6).optional(),
    name: z.string().max(100).optional(),
    gender: z.string().max(50).optional(),
    birthDate: z.string().optional(),
    location: z.string().max(200).optional(),
    interests: z.array(z.string().max(50)).max(20).optional(),
    job: z.string().max(200).optional(),
  }))
  .handler(async ({ data }) => {
    const session = await requireSession()

    return prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.photos !== undefined && { photos: data.photos }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.interests !== undefined && { interests: data.interests }),
        ...(data.job !== undefined && { job: data.job }),
      },
      create: {
        userId: session.user.id,
        name: data.name || session.user.name || session.user.email.split('@')[0],
        bio: data.bio ?? '',
        photos: data.photos ?? [],
        gender: data.gender ?? '',
        location: data.location ?? '',
        interests: data.interests ?? [],
      },
    })
  })
