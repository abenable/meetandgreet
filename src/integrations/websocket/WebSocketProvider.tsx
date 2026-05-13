import { createContext, useContext, type ReactNode } from 'react'
import { useWebSocket, type WSMessage } from '#/hooks/useWebSocket'

interface WebSocketContextValue {
  connected: boolean
  lastMessage: WSMessage | null
  send: (message: any) => void
  subscribeToEvent: (eventId: string) => void
  unsubscribeFromEvent: (eventId: string) => void
  sendTyping: (chatId: string, isTyping: boolean) => void
  reconnect: () => void
  disconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const ws = useWebSocket({
    autoReconnect: true,
    onConnect: () => {
      console.log('WebSocket provider connected')
    },
    onDisconnect: () => {
      console.log('WebSocket provider disconnected')
    },
  })

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider')
  }
  return context
}
