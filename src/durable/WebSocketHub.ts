import { DurableObject } from 'cloudflare:workers'

interface HubAttachment {
  userId: string | null
  events: string[]
}

function makeMessage(type: string, payload: unknown) {
  return JSON.stringify({ type, payload, timestamp: Date.now() })
}

/**
 * Singleton Durable Object ("hub") that owns every WebSocket connection.
 *
 * Uses the Hibernation API: idle sockets cost nothing, and each connection
 * carries an attachment ({userId, events}) that survives hibernation.
 *
 * Broadcasts arrive via RPC from server code (see websocket-broadcast.ts):
 * - broadcastToUser -> sockets tagged `user:<id>` at accept time
 * - broadcastToEvent -> sockets whose attachment lists the event id
 */
export class WebSocketHub extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') || null

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket]

    const tags = userId ? [`user:${userId}`] : []
    this.ctx.acceptWebSocket(server, tags)
    const attachment: HubAttachment = { userId, events: [] }
    server.serializeAttachment(attachment)

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string') return

    let msg: any
    try {
      msg = JSON.parse(message)
    } catch {
      ws.send(makeMessage('error', { message: 'Invalid message format' }))
      return
    }

    const attachment =
      (ws.deserializeAttachment() as HubAttachment | null) ?? { userId: null, events: [] }

    switch (msg.type) {
      case 'subscribe_event':
        if (msg.eventId && !attachment.events.includes(msg.eventId)) {
          attachment.events.push(msg.eventId)
          ws.serializeAttachment(attachment)
        }
        break
      case 'unsubscribe_event':
        if (msg.eventId) {
          attachment.events = attachment.events.filter((id) => id !== msg.eventId)
          ws.serializeAttachment(attachment)
        }
        break
      case 'ping':
        ws.send(makeMessage('online_status', { pong: true }))
        break
      default:
        break
    }
  }

  async broadcastToUser(userId: string, message: string) {
    for (const client of this.ctx.getWebSockets(`user:${userId}`)) {
      try {
        client.send(message)
      } catch (error) {
        console.error('[WebSocketHub] Failed to send to user socket:', error)
      }
    }
  }

  async broadcastToEvent(eventId: string, message: string) {
    for (const client of this.ctx.getWebSockets()) {
      const attachment = client.deserializeAttachment() as HubAttachment | null
      if (attachment?.events?.includes(eventId)) {
        try {
          client.send(message)
        } catch (error) {
          console.error('[WebSocketHub] Failed to send to event socket:', error)
        }
      }
    }
  }
}
