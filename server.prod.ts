import './dist/server/instrument.server.mjs'

// @ts-ignore - built output, not present at type-check time
import serverEntry from './dist/server/server.js'

const port = Number(process.env.PORT) || 3000

// @ts-ignore - Bun global
Bun.serve({
  port,
  hostname: '0.0.0.0',
  fetch: serverEntry.fetch,
  error(error: Error) {
    console.error('Server error:', error)
    return new Response('Internal Server Error', { status: 500 })
  },
})

console.log(`Server running at http://0.0.0.0:${port}`)
