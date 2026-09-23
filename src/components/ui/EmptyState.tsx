import type { ComponentType, ReactNode } from 'react'
import { cn } from '#/lib/cn'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card bg-canvas-raised px-6 py-12 text-center shadow-sm',
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-media bg-canvas-soft text-ink-faint">
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </span>
      )}
      <h2 className="text-h3 text-ink">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-[17rem] text-body-sm text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
