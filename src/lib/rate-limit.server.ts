import { getRequest } from '@tanstack/react-start/server'
import { CLIENT_IP_HEADER, parseTrustedHops, resolveClientIp } from '#/lib/client-ip'

export { CLIENT_IP_HEADER }

const trustedHops = parseTrustedHops(process.env.TRUST_PROXY)

export function getClientIdentifier(): string {
  const request = getRequest()

  // cf-connecting-ip is set by Cloudflare's edge from the real TCP peer, so it
  // is authoritative on the Workers deployment (and set to a loopback address
  // in local dev by workerd). Re-deriving it from x-forwarded-for would risk
  // trusting a hop the edge doesn't.
  const resolved = request.headers.get(CLIENT_IP_HEADER)
  if (resolved?.trim()) return resolved.trim()

  // Fallback for runtimes where the edge doesn't set the header.
  return resolveClientIp(request.headers, { trustedHops }) ?? 'unknown'
}

/**
 * Rate-limit key that survives IP rotation for authenticated callers by
 * combining the network identity with the user id.
 */
export function getUserScopedIdentifier(userId: string): string {
  return `${getClientIdentifier()}:${userId}`
}
