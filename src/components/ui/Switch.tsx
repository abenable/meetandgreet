import { useId } from 'react'
import type { ReactNode } from 'react'
import { cn } from '#/lib/cn'

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  leading,
  className,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
  leading?: ReactNode
  className?: string
}) {
  const id = useId()
  const descriptionId = description ? `${id}-description` : undefined

  return (
    <div
      className={cn(
        'flex items-start gap-3 border-b border-hairline-soft py-3.5 last:border-b-0',
        className,
      )}
    >
      {leading && (
        <span className="mt-0.5 shrink-0 text-ink-muted [&>svg]:h-5 [&>svg]:w-5">{leading}</span>
      )}
      <span className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-body text-ink">
          {label}
        </label>
        {description && (
          <span id={descriptionId} className="mt-0.5 block text-body-sm text-ink-muted">
            {description}
          </span>
        )}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50',
          checked ? 'bg-ink shadow-sm' : 'bg-hairline',
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-5 w-5 rounded-full bg-canvas-raised shadow-sm transition-all',
            checked ? 'left-6' : 'left-1',
          )}
        />
      </button>
    </div>
  )
}
