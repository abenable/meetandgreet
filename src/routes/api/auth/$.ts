import { createFileRoute } from '@tanstack/react-router'
import { auth } from '#/lib/auth'

async function handleAuthRequest(request: Request) {
  try {
    return await auth.handler(request)
  } catch (error: any) {
    console.error('[Auth API Error]', error)
    return Response.json(
      { error: error?.message || 'Auth handler failed' },
      { status: 500 },
    )
  }
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
})
