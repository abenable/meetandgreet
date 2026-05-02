import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { deleteR2Object, getR2KeyFromUrl, r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '#/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { requireSession } from '#/server/auth'

export const uploadImage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    key: z.string().min(1),
    imageBase64: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    const session = await requireSession()

    const base64Data = data.imageBase64.split(',')[1]
    if (!base64Data) throw new Error('Invalid image data')

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
