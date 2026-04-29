import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, MoreVertical, Shield, Send, Smile } from 'lucide-react'
import { mockMatches } from '#/lib/mock-data'

export const Route = createFileRoute('/matches/$matchId')({ component: ChatPage })

function ChatPage() {
  const { matchId } = Route.useParams()
  const match = mockMatches.find((m) => m.matchId === matchId) || mockMatches[0]
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(match.messages)

  const handleSend = () => {
    if (!input.trim()) return
    const newMsg = {
      id: `new-${Date.now()}`,
      senderId: 'me',
      content: input.trim(),
      createdAt: 'Just now',
    }
    setMessages((prev) => [...prev, newMsg])
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <main className="page-wrap flex h-[calc(100vh-120px)] flex-col px-4">
      <div className="flex items-center gap-3 border-b border-[var(--mag-line)] py-3">
        <Link to="/matches" className="rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)] no-underline">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <img src={match.avatar} alt={match.name} className="h-9 w-9 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-[var(--mag-ink)]">
            {match.name}
          </h2>
        </div>
        <button className="rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)]">
          <Shield className="h-5 w-5" />
        </button>
        <button className="rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)]">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 hide-scrollbar space-y-3">
        <div className="text-center text-xs text-[var(--mag-ink-muted)]">
          You matched on Oct 12
        </div>
        {messages.map((msg) => {
          const isMe = msg.senderId === 'me'
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMe
                    ? 'bg-[var(--mag-green)] text-white rounded-br-md'
                    : 'bg-[var(--mag-line)] text-[var(--mag-ink)] rounded-bl-md'
                }`}
              >
                <p className="leading-relaxed">{msg.content}</p>
                <span className={`mt-1 block text-right text-[10px] ${isMe ? 'text-white/70' : 'text-[var(--mag-ink-muted)]'}`}>
                  {msg.createdAt}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--mag-line)] py-3">
        <button className="rounded-full p-2 text-[var(--mag-ink-muted)] hover:bg-[var(--mag-surface)]">
          <Smile className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-w-0 flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--input-bg)] py-2.5 px-4 text-sm text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
        />
        <button
          onClick={handleSend}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mag-green)] text-white shadow-md transition hover:bg-[var(--mag-green-dark)] disabled:opacity-50"
          disabled={!input.trim()}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </main>
  )
}
