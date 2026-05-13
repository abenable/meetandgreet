import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export interface WSMessage {
  type: 'chat_message' | 'match_created' | 'typing' | 'read_receipt' | 'online_status' | 'error'
  payload: any
  timestamp: number
}

interface UseWebSocketOptions {
  onMessage?: (message: WSMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  autoReconnect?: boolean
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { onMessage, onConnect, onDisconnect, autoReconnect = true } = options
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  const queryClient = useQueryClient()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)

    ws.onopen = () => {
      console.log('WebSocket connected')
      setConnected(true)
      reconnectAttemptsRef.current = 0
      onConnect?.()
    }

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data)
        setLastMessage(message)
        onMessage?.(message)
        handleMessage(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setConnected(false)
      wsRef.current = null
      onDisconnect?.()

      if (autoReconnect) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)
        reconnectTimeoutRef.current = setTimeout(connect, delay)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    wsRef.current = ws
  }, [autoReconnect, onConnect, onDisconnect, onMessage])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
  }, [])

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, message not sent:', message)
    }
  }, [])

  const subscribeToEvent = useCallback((eventId: string) => {
    send({ type: 'subscribe_event', eventId })
  }, [send])

  const unsubscribeFromEvent = useCallback((eventId: string) => {
    send({ type: 'unsubscribe_event', eventId })
  }, [send])

  const sendTyping = useCallback((chatId: string, isTyping: boolean) => {
    send({ type: 'typing', chatId, isTyping })
  }, [send])

  const handleMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'chat_message':
        // Invalidate chat queries to fetch new message
        queryClient.invalidateQueries({ queryKey: ['chat', message.payload.chatId] })
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        break

      case 'match_created':
        // Invalidate matches and show notification
        queryClient.invalidateQueries({ queryKey: ['matches'] })
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        break

      case 'read_receipt':
        // Update read status in cache
        queryClient.invalidateQueries({ queryKey: ['chat', message.payload.chatId] })
        break

      case 'typing':
        // Handle typing indicator (managed by component state)
        break

      case 'online_status':
        // Handle online/offline status
        break

      case 'error':
        console.error('WebSocket error:', message.payload)
        break
    }
  }

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    connected,
    lastMessage,
    send,
    subscribeToEvent,
    unsubscribeFromEvent,
    sendTyping,
    reconnect: connect,
    disconnect,
  }
}

// Hook for chat-specific WebSocket features
export function useChatWebSocket(chatId: string) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const handleMessage = useCallback((message: WSMessage) => {
    if (message.type === 'typing' && message.payload.chatId === chatId) {
      const { userId, isTyping } = message.payload
      
      if (isTyping) {
        setTypingUsers(prev => new Set(prev).add(userId))
        
        // Clear existing timeout
        const existingTimeout = typingTimeoutRef.current.get(userId)
        if (existingTimeout) clearTimeout(existingTimeout)
        
        // Set new timeout to remove typing indicator after 3 seconds
        const timeout = setTimeout(() => {
          setTypingUsers(prev => {
            const next = new Set(prev)
            next.delete(userId)
            return next
          })
          typingTimeoutRef.current.delete(userId)
        }, 3000)
        
        typingTimeoutRef.current.set(userId, timeout)
      } else {
        setTypingUsers(prev => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
        const timeout = typingTimeoutRef.current.get(userId)
        if (timeout) {
          clearTimeout(timeout)
          typingTimeoutRef.current.delete(userId)
        }
      }
    }
  }, [chatId])

  const ws = useWebSocket({ onMessage: handleMessage })

  useEffect(() => {
    return () => {
      // Cleanup all timeouts
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout))
      typingTimeoutRef.current.clear()
    }
  }, [])

  return {
    ...ws,
    typingUsers: Array.from(typingUsers),
  }
}
