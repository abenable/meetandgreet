import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Calendar } from 'lucide-react'
import { getConversations } from '#/server/conversations'

export const Route = createFileRoute('/chats')({ component: ChatsPage })

function ChatsPage() {
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
  })

  return (
    <div className="page-wrap flex flex-1 flex-col px-4 py-4">
      <h1 className="mb-4 text-xl font-bold text-[var(--mag-ink)]">Chats</h1>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <MessageCircle className="mb-3 h-12 w-12 text-[var(--mag-ink-muted)]" />
          <p className="text-sm text-[var(--mag-ink-soft)]">No conversations yet.</p>
          <p className="mt-1 text-xs text-[var(--mag-ink-muted)]">Start matching or join an event to chat.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((convo: any) => (
            <ChatRow key={convo.id} convo={convo} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChatRow({ convo }: { convo: any }) {
  const to =
    convo.type === 'match'
      ? { to: '/matches/$matchId' as const, params: { matchId: convo.matchId } }
      : { to: '/events/chat/$eventId/$peerId' as const, params: { eventId: convo.eventId, peerId: convo.peerId } }

  return (
    <Link
      {...to}
      className="flex items-center gap-3 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-3 transition hover:border-[var(--mag-green)] no-underline card-shadow"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[var(--mag-line)]">
        {convo.peerPhoto ? (
          <img src={convo.peerPhoto} alt={convo.peerName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--mag-ink-muted)]">
            {convo.peerName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--mag-ink)]">{convo.peerName}</h3>
          {convo.type === 'organizer' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--mag-green)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--mag-green)]">
              <Calendar className="h-2.5 w-2.5" />
              {convo.eventName}
            </span>
          )}
        </div>
        <p className={`truncate text-xs ${convo.unreadCount > 0 ? 'font-medium text-[var(--mag-ink)]' : 'text-[var(--mag-ink-soft)]'}`}>
          {convo.lastMessage}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[10px] text-[var(--mag-ink-muted)]">
          {new Date(convo.lastMessageAt).toLocaleDateString()}
        </span>
        {convo.unreadCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--mag-green)] px-1.5 text-[10px] font-bold text-white">
            {convo.unreadCount}
          </span>
        )}
      </div>
    </Link>
  )
}
