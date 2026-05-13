import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import { auth } from '#/lib/auth'
import { prisma } from '#/db'

export interface WSMessage {
  type: 'chat_message' | 'match_created' | 'typing' | 'read_receipt' | 'online_status' | 'error'
  payload: any
  timestamp: number
}

interface ConnectedClient {
  userId: string
  ws: WebSocket
  eventIds: Set<string>
  lastActivity: number
}

const clients = new Map<string, ConnectedClient>()

export function createWebSocketServer(server: any) {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', async (request: IncomingMessage, socket: any, head: Buffer) => {
    if (request.url !== '/ws') {
      socket.destroy()
      return
    }

    try {
      const userId = await authenticateWebSocket(request)
      if (!userId) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, userId)
      })
    } catch (error) {
      console.error('WebSocket auth error:', error)
      socket.destroy()
    }
  })

  wss.on('connection', (ws: WebSocket, request: IncomingMessage, userId: string) => {
    const client: ConnectedClient = {
      userId,
      ws,
      eventIds: new Set(),
      lastActivity: Date.now(),
    }
    clients.set(userId, client)

    console.log(`WebSocket connected: ${userId}`)

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())
        await handleClientMessage(client, message)
        client.lastActivity = Date.now()
      } catch (error) {
        console.error('WebSocket message error:', error)
        sendToClient(client, {
          type: 'error',
          payload: { message: 'Invalid message format' },
          timestamp: Date.now(),
        })
      }
    })

    ws.on('close', () => {
      console.log(`WebSocket disconnected: ${userId}`)
      clients.delete(userId)
    })

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${userId}:`, error)
      clients.delete(userId)
    })

    // Send connection confirmation
    sendToClient(client, {
      type: 'online_status',
      payload: { connected: true, userId },
      timestamp: Date.now(),
    })
  })

  // Cleanup idle connections every 5 minutes
  setInterval(() => {
    const now = Date.now()
    const timeout = 10 * 60 * 1000 // 10 minutes
    for (const [userId, client] of clients.entries()) {
      if (now - client.lastActivity > timeout) {
        console.log(`Closing idle connection: ${userId}`)
        client.ws.close()
        clients.delete(userId)
      }
    }
  }, 5 * 60 * 1000)

  return wss
}

async function authenticateWebSocket(request: IncomingMessage): Promise<string | null> {
  try {
    const cookies = parseCookies(request.headers.cookie || '')
    const sessionToken = cookies['better-auth.session_token']
    
    if (!sessionToken) return null

    const session = await auth.api.getSession({ headers: request.headers as any })
    return session?.user?.id || null
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    if (key && value) acc[key] = decodeURIComponent(value)
    return acc
  }, {} as Record<string, string>)
}

async function handleClientMessage(client: ConnectedClient, message: any) {
  switch (message.type) {
    case 'subscribe_event':
      if (message.eventId) {
        // Verify user is attendee
        const attendee = await prisma.eventAttendee.findFirst({
          where: {
            eventId: message.eventId,
            userId: client.userId,
            leftAt: null,
          },
        })
        if (attendee) {
          client.eventIds.add(message.eventId)
          console.log(`${client.userId} subscribed to event ${message.eventId}`)
        }
      }
      break

    case 'unsubscribe_event':
      if (message.eventId) {
        client.eventIds.delete(message.eventId)
      }
      break

    case 'typing':
      if (message.chatId) {
        await broadcastTyping(client.userId, message.chatId, message.isTyping)
      }
      break

    case 'ping':
      sendToClient(client, {
        type: 'online_status',
        payload: { pong: true },
        timestamp: Date.now(),
      })
      break
  }
}

function sendToClient(client: ConnectedClient, message: WSMessage) {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message))
  }
}

export function broadcastChatMessage(chatId: string, message: any) {
  const wsMessage: WSMessage = {
    type: 'chat_message',
    payload: { chatId, message },
    timestamp: Date.now(),
  }

  for (const client of clients.values()) {
    // Send to users involved in this chat
    sendToClient(client, wsMessage)
  }
}

export function broadcastMatchCreated(eventId: string, user1Id: string, user2Id: string, matchId: string) {
  const wsMessage: WSMessage = {
    type: 'match_created',
    payload: { eventId, matchId },
    timestamp: Date.now(),
  }

  const client1 = clients.get(user1Id)
  const client2 = clients.get(user2Id)

  if (client1 && client1.eventIds.has(eventId)) {
    sendToClient(client1, { ...wsMessage, payload: { ...wsMessage.payload, peerId: user2Id } })
  }
  if (client2 && client2.eventIds.has(eventId)) {
    sendToClient(client2, { ...wsMessage, payload: { ...wsMessage.payload, peerId: user1Id } })
  }
}

export function broadcastReadReceipt(chatId: string, userId: string, messageId: string) {
  const wsMessage: WSMessage = {
    type: 'read_receipt',
    payload: { chatId, userId, messageId },
    timestamp: Date.now(),
  }

  for (const client of clients.values()) {
    sendToClient(client, wsMessage)
  }
}

async function broadcastTyping(userId: string, chatId: string, isTyping: boolean) {
  const wsMessage: WSMessage = {
    type: 'typing',
    payload: { chatId, userId, isTyping },
    timestamp: Date.now(),
  }

  for (const client of clients.values()) {
    if (client.userId !== userId) {
      sendToClient(client, wsMessage)
    }
  }
}

export function getConnectedUserIds(): string[] {
  return Array.from(clients.keys())
}

export function isUserOnline(userId: string): boolean {
  return clients.has(userId)
}
