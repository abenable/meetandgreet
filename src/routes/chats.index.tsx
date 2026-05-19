import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { getConversations } from '#/server/conversations'
import AvatarImage from '#/components/AvatarImage'
import { VerifiedBadge } from '#/components/VerifiedBadge'

export const Route = createFileRoute('/chats/')({ component: ChatsPage })

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
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--mag-ink-muted)] border-t-transparent" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <MessageCircle className="mb-3 h-12 w-12 text-[var(--mag-ink-muted)]" />
          <p className="text-sm text-[var(--mag-ink-soft)]">No conversations yet.</p>
          <p className="mt-1 text-xs text-[var(--mag-ink-muted)]">Start matching or join an event to chat.</p>
        </div>
      ) : (
        <div className="border-t border-[var(--mag-line)]">
          {conversations.map((convo: any) => (
            <ChatRow key={convo.id} convo={convo} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChatRow({ convo }: { convo: any }) {
  return (
    <Link
      to="/chats/$chatId"
      params={{ chatId: convo.chatId }}
      className="flex items-center gap-3 border-b border-[var(--mag-line)] p-3 transition no-underline hover:bg-[var(--mag-surface)]"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[var(--mag-line)]">
        <AvatarImage src={convo.peerPhoto} alt={convo.peerName} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--mag-ink)]">{convo.peerName}</h3>
          {convo.peerVerifiedAt && <VerifiedBadge />}
        </div>
        <p className={`truncate text-xs ${convo.unreadCount > 0 ? 'font-medium text-[var(--mag-ink)]' : 'text-[var(--mag-ink-soft)]'}`}>
          {convo.lastMessage}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[10px] text-[var(--mag-ink-muted)]" suppressHydrationWarning>
          {new Date(convo.lastMessageAt).toLocaleDateString()}
        </span>
        {convo.unreadCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--mag-ink)] px-1.5 text-[10px] font-bold text-[var(--mag-bg)]">
            {convo.unreadCount}
          </span>
        )}
      </div>
    </Link>
  )
}
