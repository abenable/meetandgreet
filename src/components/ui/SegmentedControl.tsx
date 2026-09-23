import { cn } from '#/lib/cn'
import { CountBadge } from './Badge'

export interface Segment<T extends string> {
  value: T
  label: string
  count?: number
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
}: {
  segments: ReadonlyArray<Segment<T>>
  value: T
  onChange: (value: T) => void
  className?: string
  'aria-label'?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex items-center gap-1 rounded-full bg-canvas-soft p-1',
        className,
      )}
    >
      {segments.map((segment) => {
        const active = segment.value === value
        return (
          <button
            key={segment.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(segment.value)}
            className={cn(
              'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-body-sm font-semibold transition',
              active
                ? 'bg-canvas-raised text-ink ring-1 ring-hairline'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            <span className="truncate">{segment.label}</span>
            {segment.count !== undefined && (
              <CountBadge
                count={segment.count}
                tone={active ? 'ink' : 'neutral'}
                className={cn('h-4 min-w-4 px-1', !active && 'bg-field')}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
