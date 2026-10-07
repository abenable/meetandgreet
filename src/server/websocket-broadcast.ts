// WebSocket broadcasting utilities
// Broadcasts are delivered through the WebSocketHub Durable Object
// (see src/durable/WebSocketHub.ts and src/worker.ts).

import type { WebSocketHub } from '#/durable/WebSocketHub'

export interface WSMessage {
  type: 'chat_message' | 'match_created' | 'typing' | 'read_receipt' | 'online_status' | 'event_post' | 'error'
  payload: any
  timestamp: number
}

type HubStub = DurableObjectStub<WebSocketHub>

async function getHub(): Promise<DurableObjectStub<WebSocketHub> | null> {
  try {
    const { env } = await import('cloudflare:workers')
    const hub = env.WEB_SOCKET_HUB
    return hub.get(hub.idFromName('hub'))
  } catch {
    // cloudflare:workers is unavailable (e.g. unit tests) — skip broadcasting
    return null
  }
}

function dispatch(run: (hub: HubStub) => Promise<void>) {
  getHub()
    .then((hub) => (hub ? run(hub) : undefined))
    .catch((error) => console.error('Failed to broadcast WebSocket message:', error))
}

export function broadcastToUser(userId: string, message: WSMessage) {
  dispatch((hub) => hub.broadcastToUser(userId, JSON.stringify(message)))
}

export function broadcastToEvent(eventId: string, message: WSMessage) {
  dispatch((hub) => hub.broadcastToEvent(eventId, JSON.stringify(message)))
}

export function broadcastChatMessage(chatId: string, message: any, recipientId: string) {
  const wsMessage: WSMessage = {
    type: 'chat_message',
    payload: { chatId, message },
    timestamp: Date.now(),
  }

  broadcastToUser(recipientId, wsMessage)
}

export function broadcastMatchCreated(eventId: string | null, user1Id: string, user2Id: string, matchId: string) {
  const wsMessage1: WSMessage = {
    type: 'match_created',
    payload: { eventId, matchId, peerId: user2Id },
    timestamp: Date.now(),
  }

  const wsMessage2: WSMessage = {
    type: 'match_created',
    payload: { eventId, matchId, peerId: user1Id },
    timestamp: Date.now(),
  }

  broadcastToUser(user1Id, wsMessage1)
  broadcastToUser(user2Id, wsMessage2)
}

export function broadcastReadReceipt(chatId: string, userId: string, messageId: string, recipientId: string) {
  const wsMessage: WSMessage = {
    type: 'read_receipt',
    payload: { chatId, userId, messageId },
    timestamp: Date.now(),
  }

  broadcastToUser(recipientId, wsMessage)
}
