import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send } from 'lucide-react'
import { getMessages, sendMessage } from '#/server/swipes'

export const Route = createFileRoute('/matches/$matchId')({ component: ChatPage })

function ChatPage() {
  const { matchId } = useParams({ from: '/matches/$matchId' })
  const qc = useQueryClient()
  const [input, setInput] = useState('')

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', matchId],
    queryFn: () => getMessages({ data: matchId }),
  })

  const handleSend = async () => {
    if (!input.trim()) return
    await sendMessage({ data: { matchId, content: input.trim() } })
    setInput('')
    qc.invalidateQueries({ queryKey: ['messages', matchId] })
  }

  return (
    <div className="page-wrap flex h-[calc(100dvh-112px)] flex-col px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => history.back()} className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Chat</h1>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center"><div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" /></div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--mag-ink-muted)]">Start the conversation!</div>
        ) : (
          messages.map((msg: any) => (
            <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.senderId === 'me' ? 'rounded-br-sm bg-[var(--mag-green)] text-white' : 'rounded-bl-sm bg-[var(--mag-surface)] text-[var(--mag-ink)]'}`}>
                {msg.content}
                <span className={`ml-2 text-[10px] ${msg.senderId === 'me' ? 'text-white/70' : 'text-[var(--mag-ink-muted)]'}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
