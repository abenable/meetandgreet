import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react'
import { cn } from '#/lib/cn'
import { formatClock } from './time'
import { VoiceMessage } from './VoiceMessage'

export type MessageStatus = 'sending' | 'sent' | 'read' | 'failed'

export interface ChatMessageView {
  id: string
  content: string
  type?: string | null
  audioUrl?: string | null
  createdAt: Date | string
  readAt?: Date | string | null
  isMine: boolean
  status?: MessageStatus
}

function StatusIcon({ status }: { status: MessageStatus }) {
  if (status === 'sending') return <Clock className="h-3 w-3 opacity-70" aria-label="Sending" />
  if (status === 'failed') return <AlertCircle className="h-3 w-3 text-danger" aria-label="Failed" />
  if (status === 'read') return <CheckCheck className="h-3 w-3 text-accent" aria-label="Read" />
  return <Check className="h-3 w-3 opacity-70" aria-label="Sent" />
}

export function MessageBubble({
  message,
  isGroupEnd,
  onRetry,
  played,
  onPlayed,
}: {
  message: ChatMessageView
  isGroupEnd: boolean
  onRetry?: () => void
  played?: boolean
  onPlayed?: () => void
}) {
  const status: MessageStatus =
    message.status ?? (message.isMine && message.readAt ? 'read' : 'sent')
  const isVoice = message.type === 'voice' && !!message.audioUrl

  return (
    <div
      className={cn(
        'flex flex-col',
        message.isMine ? 'items-end' : 'items-start',
        isGroupEnd ? 'mb-3' : 'mb-0.5',
      )}
    >
      {isVoice ? (
        <VoiceMessage
          url={message.audioUrl!}
          isMine={message.isMine}
          played={played}
          onPlayed={onPlayed}
        />
      ) : (
        <div
          className={cn(
            'max-w-[78%] px-3.5 py-2 text-body whitespace-pre-wrap break-words',
            message.isMine
              ? 'rounded-[22px] bg-ink text-on-ink'
              : 'rounded-[22px] bg-canvas-raised text-ink shadow-sm',
            isGroupEnd && (message.isMine ? 'rounded-br-md' : 'rounded-bl-md'),
            status === 'sending' && 'opacity-70',
            status === 'failed' && 'ring-1 ring-danger',
          )}
        >
          {message.content}
        </div>
      )}

      {isGroupEnd && (
        <div className="mt-1 flex items-center gap-1 px-1 text-caption text-ink-faint">
          <span suppressHydrationWarning>{formatClock(message.createdAt)}</span>
          {message.isMine && <StatusIcon status={status} />}
        </div>
      )}

      {status === 'failed' && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-0.5 px-1 text-caption text-danger underline underline-offset-2"
        >
          Tap to retry
        </button>
      )}
    </div>
  )
}

export function DaySeparator({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center justify-center">
      <span className="rounded-full bg-canvas-soft px-3 py-1 text-caption text-ink-muted">
        {label}
      </span>
    </div>
  )
}

export function TypingBubble() {
  return (
    <div className="mb-3 flex justify-start">
      <div className="flex gap-1 rounded-[22px] rounded-bl-md bg-canvas-raised px-4 py-3 shadow-sm">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            style={{ animationDelay: `${delay}ms` }}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint"
          />
        ))}
      </div>
    </div>
  )
}
