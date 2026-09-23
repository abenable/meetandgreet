import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  back,
  action,
}: {
  title: string
  back?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {back && (
        <Link
          to={back}
          aria-label="Go back"
          className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-canvas-soft hover:text-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      )}
      <h1 className="min-w-0 flex-1 truncate text-h2 text-ink">{title}</h1>
      {action}
    </div>
  )
}
