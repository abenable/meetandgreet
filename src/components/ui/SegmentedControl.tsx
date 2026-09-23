import { cn } from '#/lib/cn'
import { CountBadge } from './Badge'

export interface Segment<T extends string> {
  value: T
  label: string
  count?: number
}

/**
 * The single tab pattern for the app — a soft stadium track holding pill
 * options, the active one lifted to canvas. Replaces the three different tab
 * treatments the screens had grown independently.
 */
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
              'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-label transition',
              // Lifted by a rung plus a hairline rather than by a shadow.
              // A plain `bg-canvas` pill would sit *below* the track in dark
              // mode, where canvas is darker than canvas-soft.
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
