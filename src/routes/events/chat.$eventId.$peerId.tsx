import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Check, CheckCheck } from 'lucide-react'
import { getEventChat, sendEventChat, markOrganizerMessagesRead } from '#/server/events'
import { getProfileByUserId } from '#/server/profiles'

export const Route = createFileRoute('/events/chat/$eventId/$peerId')({ component: EventChatPage })

function EventChatPage() {
  const { eventId, peerId } = useParams({ from: '/events/chat/$eventId/$peerId' })
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [input, setInput] = useState('')

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['event-chat', eventId, peerId],
    queryFn: () => getEventChat({ data: { eventId, peerId } }),
  })

  const { data: peerProfile } = useQuery({
    queryKey: ['profile', peerId],
    queryFn: () => getProfileByUserId({ data: peerId }),
  })

  // Mark peer's messages as read when viewing the chat
  useEffect(() => {
    markOrganizerMessagesRead({ data: { eventId, senderId: peerId } }).then(() => {
      qc.invalidateQueries({ queryKey: ['my-organizer-messages'] })
    })
  }, [eventId, peerId, qc])

  const handleSend = async () => {
    if (!input.trim()) return
    await sendEventChat({ data: { eventId, peerId, content: input.trim() } })
    setInput('')
    qc.invalidateQueries({ queryKey: ['event-chat', eventId, peerId] })
    qc.invalidateQueries({ queryKey: ['my-organizer-messages'] })
  }

  const photo = peerProfile?.photos?.[0]
  const initials = peerProfile?.name?.charAt(0)?.toUpperCase() ?? '?'

  if (error) {
    return (
      <div className="page-wrap flex h-[calc(100dvh-112px)] flex-col items-center justify-center px-4 py-4 text-center">
        <p className="text-sm text-red-500">{(error as any)?.message || 'Unable to open chat.'}</p>
        <button
          onClick={() => navigate({ to: '/events' })}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--mag-green)] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--mag-green-dark)]"
        >
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
      </div>
    )
  }

  return (
    <div className="page-wrap flex h-[calc(100dvh-112px)] flex-col px-4 py-4">
      {/* Header with peer profile */}
      <div className="mb-3 flex items-center gap-2 border-b border-[var(--mag-line)] pb-3">
        <button onClick={() => history.back()} className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center justify-center gap-2">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--mag-line)]">
            {photo ? (
              <img src={photo} alt={peerProfile?.name ?? ''} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[var(--mag-ink-muted)]">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-semibold text-[var(--mag-ink)]">
              {peerProfile?.name ?? 'User'}
            </p>
            <p className="text-[10px] text-[var(--mag-ink-muted)]">{peerProfile?.location}</p>
          </div>
        </div>
        <div className="w-9" /> {/* Spacer to balance the back button */}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center"><div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" /></div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--mag-ink-muted)]">Start the conversation!</div>
        ) : (
          messages.map((msg: any) => (
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

      <div className="mt-3 flex items-center gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20" />
        <button onClick={handleSend} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--mag-green)] text-white transition hover:bg-[var(--mag-green-dark)]">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
