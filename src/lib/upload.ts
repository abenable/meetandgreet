import { getPresignedImageUploadUrl, deleteImage } from '#/server/images'

export function resizeImageToBlob(file: File, maxWidth = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Canvas toBlob failed'))
          },
          'image/jpeg',
          0.85,
        )
      }
      img.onerror = reject
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadImageToR2(blob: Blob, key: string): Promise<string> {
  const { presignedUrl, publicUrl } = await getPresignedImageUploadUrl({
    data: { key, contentType: 'image/jpeg' },
  })

  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': 'image/jpeg',
    },
  })

  if (!response.ok) {
    throw new Error(`R2 upload failed: ${response.status} ${response.statusText}`)
  }

  return publicUrl
}

export async function maybeDeleteR2Image(url: string) {
  if (!url.startsWith('http')) return
  await deleteImage({ data: { url } })
}
