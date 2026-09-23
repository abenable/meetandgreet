import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Ban, MessageCircle } from 'lucide-react'
import {
  getChatMessages,
  getIcebreakers,
  markChatRead,
  sendChatMessage,
  uploadVoiceMessage,
} from '#/server/conversations'
import { getProfileByUserId } from '#/server/profiles'
import { blockUser } from '#/server/blocks'
import { useChatWebSocket } from '#/hooks/useWebSocket'
import { Avatar, Button, EmptyState, Sheet, Skeleton, useToast } from '#/components/ui'
import { VerifiedBadge } from '#/components/VerifiedBadge'
import {
  DaySeparator,
  MessageBubble,
  TypingBubble,
  type ChatMessageView,
  type MessageStatus,
} from '#/components/chat/MessageBubble'
import { Composer } from '#/components/chat/Composer'
import { dayKey, formatDayLabel, formatPresence, isOnline } from '#/components/chat/time'

export const Route = createFileRoute('/chats/$chatId')({ component: ChatPage })

const GROUP_WINDOW_MS = 5 * 60 * 1000

interface PendingMessage {
  tempId: string
  content: string
  type: 'text' | 'voice'
  audioUrl?: string
  blob?: Blob
  createdAt: Date
  status: MessageStatus
}

function ChatPage() {
  const { chatId } = useParams({ from: '/chats/$chatId' })
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { toast } = useToast()

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const restoreRef = useRef<number | null>(null)

  const [blockOpen, setBlockOpen] = useState(false)
  const [pending, setPending] = useState<PendingMessage[]>([])
  const [playedIds, setPlayedIds] = useState<Set<string>>(new Set())

  const { connected, sendTyping, typingUsers } = useChatWebSocket(chatId)

  const { data: chatData, isLoading, error } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => getChatMessages({ data: { chatId } }),
    refetchInterval: connected ? 30000 : 5000,
    refetchOnWindowFocus: true,
  })

  type ServerMessage = NonNullable<typeof chatData>['messages'][number]
  const [older, setOlder] = useState<ServerMessage[]>([])
  const [olderCursor, setOlderCursor] = useState<string | null>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)

  useEffect(() => {
    setOlder([])
    setOlderCursor(null)
    setPending([])
  }, [chatId])

  const hasOlder = (olderCursor ?? chatData?.nextCursor ?? null) !== null

  const loadOlder = useCallback(async () => {
    const cursor = olderCursor ?? chatData?.nextCursor ?? null
    if (!cursor || loadingOlder) return
    setLoadingOlder(true)
    const container = scrollRef.current
    restoreRef.current = container ? container.scrollHeight - container.scrollTop : null
    try {
      const page = await getChatMessages({ data: { chatId, before: cursor } })
      setOlder((prev) => [...page.messages, ...prev])
      setOlderCursor(page.nextCursor ?? null)
    } catch {
      restoreRef.current = null
    } finally {
      setLoadingOlder(false)
    }
  }, [chatId, chatData?.nextCursor, loadingOlder, olderCursor])

  useLayoutEffect(() => {
    const container = scrollRef.current
    const offset = restoreRef.current
    if (!container || offset === null) return
    container.scrollTop = container.scrollHeight - offset
    restoreRef.current = null
  }, [older])

  useEffect(() => {
    const sentinel = topSentinelRef.current
    if (!sentinel || !hasOlder) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadOlder()
      },
      { root: scrollRef.current, rootMargin: '120px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasOlder, loadOlder])

  const serverMessages = useMemo(() => {
    const seen = new Set<string>()
    return [...older, ...(chatData?.messages ?? [])].filter((m) => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
  }, [older, chatData?.messages])

  const messages: ChatMessageView[] = useMemo(() => {
    const fromServer = serverMessages.map((m) => ({
      id: m.id,
      content: m.content,
      type: (m as { type?: string }).type ?? 'text',
      audioUrl: (m as { audioUrl?: string | null }).audioUrl ?? null,
      createdAt: m.createdAt,
      readAt: (m as { readAt?: Date | null }).readAt ?? null,
      isMine: m.isMine,
    }))
    const optimistic = pending.map((p) => ({
      id: p.tempId,
      content: p.content,
      type: p.type,
      audioUrl: p.audioUrl ?? null,
      createdAt: p.createdAt,
      readAt: null,
      isMine: true,
      status: p.status,
    }))
    return [...fromServer, ...optimistic]
  }, [serverMessages, pending])

  const peerId = chatData?.peerId ?? ''
  const matchId = chatId.startsWith('match_') ? chatId.slice('match_'.length) : null

  const { data: peerProfile } = useQuery({
    queryKey: ['profile', peerId],
    queryFn: () => getProfileByUserId({ data: peerId }),
    enabled: !!peerId,
  })

  const { data: icebreakers } = useQuery({
    queryKey: ['icebreakers', matchId],
    queryFn: () => getIcebreakers({ data: matchId! }),
    enabled: !!matchId && messages.length === 0,
  })

  const block = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['friends'] })
      qc.invalidateQueries({ queryKey: ['blocked-users'] })
      navigate({ to: '/chats' })
    },
    onError: () => toast('Could not block that account.', { tone: 'error' }),
  })

  useEffect(() => {
    if (!chatId) return
    void markChatRead({ data: chatId }).then(() => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
    })
  }, [chatId, qc])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: pending.length ? 'smooth' : 'auto' })
  }, [chatData?.messages, pending.length])

  const settle = (tempId: string, status: MessageStatus | 'done') => {
    setPending((prev) =>
      status === 'done'
        ? prev.filter((p) => p.tempId !== tempId)
        : prev.map((p) => (p.tempId === tempId ? { ...p, status } : p)),
    )
  }

  const deliver = useCallback(
    async (item: PendingMessage) => {
      try {
        let audioUrl = item.audioUrl
        if (item.type === 'voice' && item.blob && !audioUrl) {
          if (!matchId) throw new Error('Voice messages are only available in direct chats')
          const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error('Could not read the recording'))
            reader.readAsDataURL(item.blob!)
          })
          const uploaded = await uploadVoiceMessage({ data: { base64Audio, matchId } })
          audioUrl = uploaded.audioUrl
        }

        await sendChatMessage({
          data: {
            chatId,
            content: item.content,
            ...(item.type === 'voice' ? { type: 'voice' as const, audioUrl } : {}),
          },
        })

        settle(item.tempId, 'done')
        qc.invalidateQueries({ queryKey: ['chat', chatId] })
        qc.invalidateQueries({ queryKey: ['conversations'] })
      } catch (e) {
        settle(item.tempId, 'failed')
        toast((e as Error)?.message || 'Message not sent.', { tone: 'error' })
      }
    },
    [chatId, matchId, qc, toast],
  )

  const queueText = (content: string) => {
    const item: PendingMessage = {
      tempId: `pending_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      content,
      type: 'text',
      createdAt: new Date(),
      status: 'sending',
    }
    setPending((prev) => [...prev, item])
    void deliver(item)
  }

  const queueVoice = (blob: Blob, secondsLong: number) => {
    const item: PendingMessage = {
      tempId: `pending_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      content: `Voice message (${secondsLong}s)`,
      type: 'voice',
      blob,
      createdAt: new Date(),
      status: 'sending',
    }
    setPending((prev) => [...prev, item])
    void deliver(item)
  }

  const retry = (tempId: string) => {
    const item = pending.find((p) => p.tempId === tempId)
    if (!item) return
    settle(tempId, 'sending')
    void deliver({ ...item, status: 'sending' })
  }

  const handleTyping = (typing: boolean) => {
    if (!connected) return
    sendTyping(chatId, typing)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (typing) {
      typingTimeoutRef.current = setTimeout(() => sendTyping(chatId, false), 2500)
    }
  }

  const presenceLabel = formatPresence(chatData?.peerLastActiveDate)
  const peerOnline = isOnline(chatData?.peerLastActiveDate)

  if (error) {
    return (
      <div className="page-wrap flex h-[var(--app-viewport-h)] flex-col items-center justify-center">
        <EmptyState
          icon={MessageCircle}
          title="This chat is unavailable"
          description={(error as Error)?.message || 'It may have been removed.'}
          action={<Button onClick={() => navigate({ to: '/chats' })}>Back to chats</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex h-[var(--app-viewport-h)] flex-col bg-canvas">
      <header className="flex shrink-0 items-center gap-3 bg-canvas-raised px-3 py-2.5 shadow-sm">
        <button
          type="button"
          onClick={() => navigate({ to: '/chats' })}
          aria-label="Back to chats"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-canvas-soft hover:text-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <Avatar
          src={peerProfile?.photos?.[0]}
          alt={peerProfile?.name ?? ''}
          size="sm"
          priority
          online={presenceLabel ? peerOnline : undefined}
        />

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-title text-ink">
            {peerProfile?.name ?? 'Chat'}
            {peerProfile?.verifiedAt && <VerifiedBadge />}
          </p>
          <p className="truncate text-caption text-ink-muted">
            {typingUsers.length > 0 ? 'Typing…' : (presenceLabel ?? peerProfile?.location ?? '')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setBlockOpen(true)}
          aria-label="Block this account"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-canvas-soft hover:text-danger"
        >
          <Ban className="h-5 w-5" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {isLoading ? (
          <div className="flex h-full flex-col justify-end gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={i % 2 ? 'flex justify-end' : 'flex justify-start'}>
                <Skeleton className={`h-10 rounded-[22px] ${i % 2 ? 'w-36' : 'w-44'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col justify-end">
            <EmptyState
              icon={MessageCircle}
              title={`Say hello to ${peerProfile?.name ?? 'them'}`}
              description="Chats open with no message requests here — just start talking."
            />
            {icebreakers && icebreakers.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-label text-ink-faint">Try one of these</p>
                {icebreakers.map((ice) => (
                  <button
                    key={ice.id}
                    type="button"
                    onClick={() => queueText(ice.text)}
                    className="block w-full rounded-card bg-canvas-raised px-4 py-3 text-left text-body text-ink shadow-sm transition hover:bg-canvas-soft"
                  >
                    {ice.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div ref={topSentinelRef} />
            {loadingOlder && (
              <p className="mb-3 text-center text-caption text-ink-faint">Loading earlier messages…</p>
            )}
            {messages.map((message, i) => {
              const previous = messages[i - 1]
              const next = messages[i + 1]

              const startsDay = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)
              const isGroupEnd =
                !next ||
                next.isMine !== message.isMine ||
                dayKey(next.createdAt) !== dayKey(message.createdAt) ||
                new Date(next.createdAt).getTime() - new Date(message.createdAt).getTime() >
                  GROUP_WINDOW_MS

              return (
                <div key={message.id}>
                  {startsDay && <DaySeparator label={formatDayLabel(message.createdAt)} />}
                  <MessageBubble
                    message={message}
                    isGroupEnd={isGroupEnd}
                    onRetry={message.status === 'failed' ? () => retry(message.id) : undefined}
                    played={message.isMine ? undefined : playedIds.has(message.id)}
                    onPlayed={() => setPlayedIds((prev) => new Set(prev).add(message.id))}
                  />
                </div>
              )
            })}
            {typingUsers.length > 0 && <TypingBubble />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <div className="shrink-0 bg-canvas-raised px-3 pt-2.5 pb-2.5 shadow-[0_-1px_16px_rgba(14,14,22,0.08)]">
        <Composer
          onSend={queueText}
          onSendVoice={queueVoice}
          onTyping={handleTyping}
          allowVoice={!!matchId}
          placeholder={`Message ${peerProfile?.name ?? ''}`.trim()}
        />
      </div>

      <Sheet
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        title={`Block ${peerProfile?.name ?? 'this account'}?`}
        description="You disappear from each other everywhere in the app, and this chat closes."
        footer={
          <>
            <Button variant="ghost" block onClick={() => setBlockOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              block
              loading={block.isPending}
              onClick={() => peerId && block.mutate({ data: peerId })}
            >
              Block
            </Button>
          </>
        }
      />
    </div>
  )
}
