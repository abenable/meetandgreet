import handler from '@tanstack/react-start/server-entry'
import { runWithPrisma } from './db'
import { WebSocketHub } from './durable/WebSocketHub'

export { WebSocketHub }

/**
 * Custom Workers entrypoint.
 * - `/ws` upgrades are routed to the WebSocketHub Durable Object; the Better
 *   Auth session is resolved so user-targeted broadcasts can find the socket.
 * - Everything else goes to the TanStack Start server handler.
 */
export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> {
    return runWithPrisma(ctx, async () => {
      const { pathname } = new URL(request.url)

      if (pathname === '/ws') {
        return handleWebSocketUpgrade(request, env)
      }

      return handler.fetch(request)
    })
  },
} satisfies ExportedHandler<Cloudflare.Env>

async function handleWebSocketUpgrade(request: Request, env: Cloudflare.Env): Promise<Response> {
  const upgradeHeader = request.headers.get('upgrade')
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 })
  }

  let userId: string | null = null
  try {
    const { auth } = await import('./lib/auth')
    const session = await auth.api.getSession({ headers: request.headers })
    userId = session?.user?.id ?? null
  } catch (error) {
    console.error('[ws] Failed to resolve session during upgrade:', error)
  }

  const hub = env.WEB_SOCKET_HUB.get(env.WEB_SOCKET_HUB.idFromName('hub'))
  const url = new URL(request.url)
  url.searchParams.set('userId', userId ?? '')
  return hub.fetch(new Request(url, request))
}
