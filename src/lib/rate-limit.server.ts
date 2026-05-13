import { getRequest } from '@tanstack/react-start/server'

export function getClientIdentifier(): string {
  const request = getRequest()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
  return ip
}
