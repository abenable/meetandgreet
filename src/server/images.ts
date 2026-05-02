import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getPresignedUploadUrl, deleteR2Object, getR2KeyFromUrl } from '#/lib/r2'
import { requireSession } from '#/server/auth'

export const getPresignedImageUploadUrl = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    key: z.string(),
    contentType: z.string(),
  }))
  .handler(async ({ data }) => {
    await requireSession()
    return getPresignedUploadUrl(data.key, data.contentType)
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
