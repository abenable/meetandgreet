import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { deleteR2Object, getR2KeyFromUrl, r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '#/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { requireSession } from '#/server/auth'
import { prisma } from '#/db'

const MAX_BASE64_LENGTH = 15_000_000 // ~10MB JPEG after encoding

export const uploadImage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    key: z.string().min(1),
    imageBase64: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    const { user } = await requireSession()

    // Validate size
    if (data.imageBase64.length > MAX_BASE64_LENGTH) {
      throw new Error('Image too large')
    }

    // Validate data URL prefix
    if (!/^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(data.imageBase64)) {
      throw new Error('Invalid image format')
    }

    const base64Data = data.imageBase64.split(',')[1]
    if (!base64Data) throw new Error('Invalid image data')

    // Validate key prefix: users can only write into their own profiles folder
    // or into events they own
    const profilePrefix = `profiles/${user.id}/`
    const eventsPrefixMatch = data.key.match(`^events/([^/]+)/`)
    if (data.key.startsWith(profilePrefix)) {
      // OK
    } else if (eventsPrefixMatch) {
      const eventId = eventsPrefixMatch[1]!
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { createdById: true },
      })
      if (!event || event.createdById !== user.id) {
        throw new Error('Unauthorized')
      }
    } else {
      throw new Error('Invalid upload path')
    }

    const buffer = Buffer.from(base64Data, 'base64')

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: data.key,
        Body: buffer,
        ContentType: 'image/jpeg',
      })
    )

    return { url: `${R2_PUBLIC_URL}/${data.key}` }
  })

export const deleteImage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    url: z.string(),
  }))
  .handler(async ({ data }) => {
    await requireSession()
    const key = getR2KeyFromUrl(data.url)
    if (key) {
      await deleteR2Object(key)
    }
    return { success: true }
  })
