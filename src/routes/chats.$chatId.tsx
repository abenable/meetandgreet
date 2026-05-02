import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Check, CheckCheck } from 'lucide-react'
import { getChatMessages, sendChatMessage, markChatRead } from '#/server/conversations'
import { getProfileByUserId } from '#/server/profiles'
import AvatarImage from '#/components/AvatarImage'

export const Route = createFileRoute('/chats/$chatId')({ component: UnifiedChatPage })

function UnifiedChatPage() {
  const { chatId } = useParams({ from: '/chats/$chatId' })
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const { data: chatData, isLoading, error } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => getChatMessages({ data: chatId }),
  })

  const peerId = chatData?.peerId ?? ''

  const { data: peerProfile } = useQuery({
    queryKey: ['profile', peerId],
    queryFn: () => getProfileByUserId({ data: peerId }),
    enabled: !!peerId,
  })

  useEffect(() => {
    if (!chatId) return
    markChatRead({ data: chatId }).then(() => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
    })
  }, [chatId, qc])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    setSendError(null)
    try {
      await sendChatMessage({ data: { chatId, content: input.trim() } })
      setInput('')
      qc.invalidateQueries({ queryKey: ['chat', chatId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
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
            <p className="truncate text-sm font-semibold text-[var(--mag-ink)]">
              {peerProfile?.name ?? 'User'}
            </p>
            <p className="text-[10px] text-[var(--mag-ink-muted)]">{peerProfile?.location}</p>
          </div>
        </div>
        <div className="w-9" />
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center"><div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" /></div>
        ) : chatData?.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--mag-ink-muted)]">Start the conversation!</div>
        ) : (
          chatData?.messages.map((msg: any) => (
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
          ))
        )}
      </div>

      {sendError && <p className="mb-1 text-xs text-red-500">{sendError}</p>}
      <div className="mt-3 flex items-center gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20 disabled:opacity-60" />
        <button onClick={handleSend} disabled={sending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--mag-green)] text-white transition hover:bg-[var(--mag-green-dark)] disabled:opacity-60">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
