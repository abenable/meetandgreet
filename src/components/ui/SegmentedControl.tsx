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
  const activeIndex = Math.max(
    0,
    segments.findIndex((s) => s.value === value),
  )

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('relative flex items-center rounded-full bg-canvas-soft p-1', className)}
    >
      <span
        aria-hidden="true"
        style={{
          width: `calc((100% - 0.5rem) / ${segments.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
        className="absolute inset-y-1 left-1 rounded-full bg-canvas-raised shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
      />

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
              'relative z-10 flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-body-sm font-semibold transition-colors duration-200',
              active ? 'text-ink' : 'text-ink-muted hover:text-ink',
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
