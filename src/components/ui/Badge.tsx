import type { HTMLAttributes } from 'react'
import { cn } from '#/lib/cn'

export type BadgeTone =
  | 'neutral'
  | 'ink'
  | 'accent'
  | 'danger'
  | 'success'
  | 'overlay'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-canvas-soft text-ink-muted',
  ink: 'bg-ink text-on-ink',
  accent: 'bg-accent text-accent-contrast',
  danger: 'bg-danger text-white',
  success: 'bg-success text-white',
  overlay: 'bg-black/55 text-on-scrim backdrop-blur-sm',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-label',
        TONES[tone],
        className,
      )}
      {...rest}
    />
  )
}

export function CountBadge({
  count,
  tone = 'accent',
  className,
}: {
  count: number
  tone?: BadgeTone
  className?: string
}) {
  if (count <= 0) return null
  return (
    <Badge
      tone={tone}
      className={cn(
        'h-5 min-w-5 justify-center px-1.5 tabular-nums',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  )
}
