declare const Bun: any
import './dist/server/instrument.server.mjs'

import { stat } from 'fs/promises'
import { join } from 'path'

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL']
const missingVars = requiredEnvVars.filter(v => !process.env[v])
if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`)
  process.exit(1)
}
console.log('✅ Environment variables validated')

// @ts-ignore - built output, not present at type-check time
import serverEntry from './dist/server/server.js'
import { setBunServer } from './dist/server/websocket-broadcast.js'

const port = Number(process.env.PORT) || 3000
const clientDir = './dist/client'

const mimeTypes: Record<string, string> = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
}

function getMimeType(path: string): string {
  const ext = path.slice(path.lastIndexOf('.'))
  return mimeTypes[ext] || 'application/octet-stream'
}

// @ts-ignore - Bun global
const server = Bun.serve({
  port,
  hostname: '0.0.0.0',
  async fetch(request: Request, server: any) {
    const url = new URL(request.url)
    const pathname = url.pathname

    // Handle WebSocket upgrade
    if (pathname === '/ws') {
      const upgraded = server.upgrade(request)
      if (upgraded) {
        return undefined // Connection upgraded to WebSocket
      }
      return new Response('WebSocket upgrade failed', { status: 400 })
    }

    // Serve static assets from dist/client first
    const staticPath = join(clientDir, pathname)
    try {
      const stats = await stat(staticPath)
      if (stats.isFile()) {
        const file = Bun.file(staticPath)
        return new Response(file, {
          headers: {
            'Content-Type': getMimeType(pathname),
            'Cache-Control': pathname.startsWith('/assets/')
              ? 'public, max-age=31536000, immutable'
              : 'public, max-age=3600',
          },
        })
      }
    } catch {
      // Not a static file — fall through to SSR
    }

    return serverEntry.fetch(request)
  },
  websocket: {
    async open(ws: any) {
      const userId = ws.data?.userId
      if (userId) {
        console.log(`WebSocket connected: ${userId}`)
        ws.subscribe(`user:${userId}`)
      }
    },
    async message(ws: any, message: string | Buffer) {
      try {
        const data = typeof message === 'string' ? message : message.toString()
        const msg = JSON.parse(data)
        await handleWebSocketMessage(ws, msg)
      } catch (error) {
        console.error('WebSocket message error:', error)
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' },
          timestamp: Date.now(),
        }))
      }
    },
    close(ws: any) {
      const userId = ws.data?.userId
      if (userId) {
        console.log(`WebSocket disconnected: ${userId}`)
      }
    },
  },
  error(error: Error) {
    console.error('Server error:', error)
    return new Response('Internal Server Error', { status: 500 })
  },
})

// Initialize WebSocket broadcasting
setBunServer(server)

async function handleWebSocketMessage(ws: any, message: any) {
  // Handle WebSocket messages
  switch (message.type) {
    case 'subscribe_event':
      if (message.eventId) {
        ws.subscribe(`event:${message.eventId}`)
      }
      break
    case 'unsubscribe_event':
      if (message.eventId) {
        ws.unsubscribe(`event:${message.eventId}`)
      }
      break
    case 'ping':
      ws.send(JSON.stringify({
        type: 'online_status',
        payload: { pong: true },
        timestamp: Date.now(),
      }))
      break
  }
}

console.log(`Server running at http://0.0.0.0:${port}`)
