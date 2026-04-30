import './dist/server/instrument.server.mjs'

import { stat } from 'fs/promises'
import { join } from 'path'

// @ts-ignore - built output, not present at type-check time
import serverEntry from './dist/server/server.js'

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
Bun.serve({
  port,
  hostname: '0.0.0.0',
  async fetch(request) {
    const url = new URL(request.url)
    const pathname = url.pathname

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
  error(error: Error) {
    console.error('Server error:', error)
    return new Response('Internal Server Error', { status: 500 })
  },
})

console.log(`Server running at http://0.0.0.0:${port}`)
