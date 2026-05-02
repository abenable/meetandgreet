import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME
const publicUrl = process.env.R2_PUBLIC_URL

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
  console.warn('[R2] Environment variables are not fully configured. Image uploads will fail.')
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
})

export const R2_BUCKET_NAME = bucketName || ''
export const R2_PUBLIC_URL = publicUrl || ''

export async function getPresignedUploadUrl(key: string, contentType: string, expiresIn = 300) {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(r2Client, command, { expiresIn })
  const publicUrl = `${R2_PUBLIC_URL}/${key}`
  return { presignedUrl: url, publicUrl }
}

export async function deleteR2Object(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })
  await r2Client.send(command)
}

export function getR2KeyFromUrl(url: string): string | null {
  if (!url.startsWith(R2_PUBLIC_URL)) return null
  return url.slice(R2_PUBLIC_URL.length + 1)
}
