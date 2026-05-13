import type { Plugin } from 'vite'
import type { WebSocket, WebSocketServer } from 'ws'

export function devWebSocketPlugin(): Plugin {
  return {
    name: 'dev-websocket',
    configureServer(server) {
      if (!server.httpServer) return

      import('ws').then(({ WebSocketServer }) => {
        const wss = new WebSocketServer({ noServer: true })
        const clients = new Map<WebSocket, Set<string>>()

        const publish = (topic: string, message: string) => {
          for (const [ws, topics] of clients) {
            if (ws.readyState === 1 /* OPEN */ && topics.has(topic)) {
              ws.send(message)
            }
          }
        }

        wss.on('connection', (ws: WebSocket) => {
          const topics = new Set<string>()
          clients.set(ws, topics)

          ws.on('message', (raw: Buffer | ArrayBuffer | Buffer[]) => {
            try {
              const data =
                typeof raw === 'string'
                  ? raw
                  : Buffer.from(raw as Buffer).toString()
              const msg = JSON.parse(data)

              switch (msg.type) {
                case 'subscribe_event':
                  if (msg.eventId) topics.add(`event:${msg.eventId}`)
                  break
                case 'unsubscribe_event':
                  if (msg.eventId) topics.delete(`event:${msg.eventId}`)
                  break
                case 'ping':
                  ws.send(
                    JSON.stringify({
                      type: 'online_status',
                      payload: { pong: true },
                      timestamp: Date.now(),
                    })
                  )
                  break
              }
            } catch {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  payload: { message: 'Invalid message format' },
                  timestamp: Date.now(),
                })
              )
            }
          })

          ws.on('close', () => clients.delete(ws))
        })

        server.httpServer!.on('upgrade', (request, socket, head) => {
          if (request.url === '/ws') {
            wss.handleUpgrade(request, socket, head, (ws) => {
              wss.emit('connection', ws, request)
            })
          }
        })

        ;(globalThis as any).__devWSS__ = { publish }
      })
    },
  }
}
