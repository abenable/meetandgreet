import { uploadImage, deleteImage } from '#/server/images'

export function resizeImageToBase64(file: File, maxWidth = 800): Promise<string> {
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
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadImageToR2(file: File, key: string, maxWidth?: number): Promise<string> {
  const base64 = await resizeImageToBase64(file, maxWidth)
  const { url } = await uploadImage({ data: { key, imageBase64: base64 } })
  return url
}

export async function maybeDeleteR2Image(url: string) {
  if (!url.startsWith('http')) return
  await deleteImage({ data: { url } })
}
