import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '#/lib/cn'

export interface ListRowProps {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  chevron?: boolean
  emphasis?: boolean
  danger?: boolean
  onClick?: () => void
  className?: string
  as?: 'div' | 'button'
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  chevron = false,
  emphasis = false,
  danger = false,
  onClick,
  className,
  as = 'div',
}: ListRowProps) {
  const Element = as
  return (
    <Element
      {...(as === 'button' ? { type: 'button' as const, onClick } : { onClick })}
      className={cn(
        'flex w-full items-center gap-3 border-b border-hairline-soft px-1 py-3 text-left transition',
        (onClick || chevron) && 'hover:bg-canvas-soft',
        className,
      )}
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'flex items-center gap-1.5 truncate',
            emphasis ? 'text-title text-ink' : 'text-body text-ink',
            danger && 'text-danger',
          )}
        >
          {title}
        </span>
        {subtitle && (
          <span
            className={cn(
              'mt-0.5 block truncate text-body-sm',
              emphasis ? 'text-ink' : 'text-ink-muted',
            )}
          >
            {subtitle}
          </span>
        )}
      </span>
      {trailing}
      {chevron && (
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
      )}
    </Element>
  )
}
