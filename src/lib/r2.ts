import { env } from 'cloudflare:workers'

export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

export async function putR2Object(key: string, body: ArrayBufferView, contentType: string) {
  await env.R2.put(key, body, { httpMetadata: { contentType } })
}

export async function deleteR2Object(key: string) {
  await env.R2.delete(key)
}

export function getR2KeyFromUrl(url: string): string | null {
  if (!url.startsWith(R2_PUBLIC_URL)) return null
  return url.slice(R2_PUBLIC_URL.length + 1)
}
