import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Check, CheckCheck, Ban } from 'lucide-react'
import { getChatMessages, sendChatMessage, markChatRead } from '#/server/conversations'
import { getProfileByUserId } from '#/server/profiles'
import { blockUser } from '#/server/blocks'
import AvatarImage from '#/components/AvatarImage'
import { VerifiedBadge } from '#/components/VerifiedBadge'
import { useChatWebSocket } from '#/hooks/useWebSocket'

export const Route = createFileRoute('/chats/$chatId')({ component: UnifiedChatPage })

function UnifiedChatPage() {
  const { chatId } = useParams({ from: '/chats/$chatId' })
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Use WebSocket for real-time updates
  const { connected, sendTyping, typingUsers } = useChatWebSocket(chatId)

  const { data: chatData, isLoading, error } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => getChatMessages({ data: chatId }),
    refetchInterval: connected ? false : 5000, // Fallback to polling if WebSocket disconnected
  })

  const peerId = chatData?.peerId ?? ''

  const { data: peerProfile } = useQuery({
    queryKey: ['profile', peerId],
    queryFn: () => getProfileByUserId({ data: peerId }),
    enabled: !!peerId,
  })

  const blockMutation = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['matches'] })
      qc.invalidateQueries({ queryKey: ['blocked-users'] })
      navigate({ to: '/chats' })
    },
  })

  const matchId = chatId.startsWith('match_') ? chatId.slice('match_'.length) : null
  const { data: icebreakers } = useQuery({
    queryKey: ['icebreakers', matchId],
    queryFn: () => getIcebreakers({ data: matchId! }),
    enabled: !!matchId && (chatData?.messages.length ?? 0) < 3,
  })

  useEffect(() => {
    if (!chatId) return
    markChatRead({ data: chatId }).then(() => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
    })
  }, [chatId, qc])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatData?.messages])

  // Handle typing indicator
  const handleInputChange = (value: string) => {
    setInput(value)
    
    // Send typing indicator
    if (connected) {
      sendTyping(chatId, true)
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(chatId, false)
      }, 2000)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    setSendError(null)
    
    // Stop typing indicator
    if (connected) {
      sendTyping(chatId, false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
    
    try {
      await sendChatMessage({ data: { chatId, content: input.trim() } })
      setInput('')
      // WebSocket will handle the update, but invalidate as fallback
      if (!connected) {
        qc.invalidateQueries({ queryKey: ['chat', chatId] })
        qc.invalidateQueries({ queryKey: ['conversations'] })
      }
    } catch (e: any) {
      setSendError(e?.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const photo = peerProfile?.photos?.[0]

  if (error) {
    return (
      <div className="page-wrap flex h-[calc(100dvh-112px)] flex-col items-center justify-center px-4 py-4 text-center">
        <p className="text-sm text-red-500">{(error as any)?.message || 'Unable to open chat.'}</p>
        <button
          onClick={() => navigate({ to: '/chats' })}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--mag-green)] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--mag-green-dark)]"
        >
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
      </div>
    )
  }

  return (
    <div className="page-wrap flex h-[calc(100dvh-112px)] flex-col px-4 py-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2 border-b border-[var(--mag-line)] pb-3">
        <button onClick={() => history.back()} className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center justify-center gap-2">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--mag-line)]">
            <AvatarImage src={photo} alt={peerProfile?.name ?? ''} />
          </div>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-semibold text-[var(--mag-ink)] flex items-center justify-center gap-1.5">
              {peerProfile?.name ?? 'User'}
              {peerProfile?.verifiedAt && <VerifiedBadge />}
            </p>
            <p className="text-[10px] text-[var(--mag-ink-muted)]">
              {connected ? (
                <span className="flex items-center justify-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  Online
                </span>
              ) : (
                peerProfile?.location
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setBlockDialogOpen(true)}
          className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]"
          title="Block user"
        >
          <Ban className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center"><div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" /></div>
        ) : chatData?.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--mag-ink-muted)]">Start the conversation!</div>
        ) : (
          <>
            {chatData?.messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.isMine ? 'rounded-br-sm bg-[var(--mag-green)] text-white' : 'rounded-bl-sm bg-[var(--mag-surface)] text-[var(--mag-ink)]'}`}>
                  {msg.content}
                  <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${msg.isMine ? 'text-white/70' : 'text-[var(--mag-ink-muted)]'}`}>
                    <span suppressHydrationWarning>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.isMine && (
                      msg.readAt ? (
                        <CheckCheck className="h-3 w-3" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-[var(--mag-surface)] px-4 py-2.5">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--mag-ink-muted)]" style={{ animationDelay: '0ms' }}></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--mag-ink-muted)]" style={{ animationDelay: '150ms' }}></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--mag-ink-muted)]" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {matchId && icebreakers && icebreakers.length > 0 && (chatData?.messages.length ?? 0) < 3 && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {icebreakers.map((ice) => (
            <button
              key={ice.id}
              onClick={() => setInput(ice.text)}
              className="shrink-0 rounded-full bg-[var(--mag-green)]/10 px-3 py-1.5 text-xs font-medium text-[var(--mag-green)]"
            >
              {ice.text}
            </button>
          ))}
        </div>
      )}
      {sendError && <p className="mb-1 text-xs text-red-500">{sendError}</p>}
      <div className="mt-3 flex items-center gap-2">
        <input type="text" value={input} onChange={(e) => handleInputChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20 disabled:opacity-60" />
        <button onClick={handleSend} disabled={sending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--mag-green)] text-white transition hover:bg-[var(--mag-green-dark)] disabled:opacity-60">
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Block Confirmation Dialog */}
      {blockDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 shadow-xl">
            <div className="mb-1 flex items-center gap-2 text-red-500">
              <Ban className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Block {peerProfile?.name ?? 'User'}</h3>
            </div>
            <p className="mb-4 text-sm text-[var(--mag-ink-soft)]">
              Block {peerProfile?.name ?? 'this user'}? They won't see you in events anymore.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setBlockDialogOpen(false)}
                className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (peerId) blockMutation.mutate({ data: peerId })
                }}
                disabled={blockMutation.isPending || !peerId}
                className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {blockMutation.isPending ? 'Blocking…' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
