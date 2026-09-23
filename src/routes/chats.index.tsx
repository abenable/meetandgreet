import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MailOpen, MessageCircle } from 'lucide-react'
import { getConversations } from '#/server/conversations'
import { Avatar, CountBadge, EmptyState, SegmentedControl, Skeleton } from '#/components/ui'
import { VerifiedBadge } from '#/components/VerifiedBadge'
import { cn } from '#/lib/cn'

export const Route = createFileRoute('/chats/')({ component: ChatsPage })

type Filter = 'all' | 'unread' | 'read'

function ChatsPage() {
  const [filter, setFilter] = useState<Filter>('all')

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
  })

  const unreadCount = useMemo(
    () => (conversations as any[]).filter((c) => c.unreadCount > 0).length,
    [conversations],
  )

  const visible = useMemo(() => {
    const list = conversations as any[]
    if (filter === 'unread') return list.filter((c) => c.unreadCount > 0)
    if (filter === 'read') return list.filter((c) => !c.unreadCount)
    return list
  }, [conversations, filter])

  return (
    <div className="page-wrap flex flex-1 flex-col py-5 pb-28">
      <h1 className="mb-5 text-center text-h1 text-ink">Chats</h1>

      {!isLoading && conversations.length > 0 && (
        <SegmentedControl
          aria-label="Filter conversations"
          className="mb-5"
          value={filter}
          onChange={setFilter}
          segments={[
            { value: 'all', label: 'All', count: conversations.length },
            { value: 'unread', label: 'Unread', count: unreadCount },
            { value: 'read', label: 'Read' },
          ]}
        />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-card bg-canvas-raised p-3 shadow-sm">
              <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-28 rounded-full" />
                <Skeleton className="h-3 w-3/4 rounded-full" />
              </div>
              <Skeleton className="h-3 w-12 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Add a friend or join an event, then say hello."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={MailOpen}
          title={filter === 'unread' ? 'Nothing unread' : 'Nothing read yet'}
          description={
            filter === 'unread'
              ? 'You are all caught up.'
              : 'Conversations you have opened will show up here.'
          }
        />
      ) : (
        <div className="space-y-2">
          {visible.map((convo: any) => (
            <ChatRow key={convo.id} convo={convo} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChatRow({ convo }: { convo: any }) {
  const unread = convo.unreadCount > 0

  return (
    <Link
      to="/chats/$chatId"
      params={{ chatId: convo.chatId }}
      className="flex items-center gap-3 rounded-card bg-canvas-raised p-3 no-underline shadow-sm transition hover:bg-canvas-soft hover:shadow-md"
    >
      <Avatar src={convo.peerPhoto} alt={convo.peerName} size="lg" />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-title text-ink">
          {convo.peerName}
          {convo.peerVerifiedAt && <VerifiedBadge />}
        </p>
        <p className={cn('truncate text-body-sm', unread ? 'text-ink' : 'text-ink-muted')}>
          {convo.lastMessage || 'Say hello'}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-caption text-ink-faint" suppressHydrationWarning>
          {new Date(convo.lastMessageAt).toLocaleDateString()}
        </span>
        <CountBadge count={convo.unreadCount} />
      </div>
    </Link>
  )
}
