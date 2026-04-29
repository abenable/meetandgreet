import { createServerFn } from '@tanstack/react-start'
import { auth } from '#/lib/auth'

export const getSession = createServerFn({ method: 'GET' })
  .handler(async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    return session ?? null
  })
