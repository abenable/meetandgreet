import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Upload, X } from 'lucide-react'

export const Route = createFileRoute('/profile/media')({ component: MediaPage })

function MediaPage() {
  const navigate = useNavigate()

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-5 flex items-center gap-2">
        <button onClick={() => navigate({ to: '/profile' })} className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">My Photos</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--mag-line)] bg-[var(--mag-surface)] text-[var(--mag-ink-muted)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)]">
          <Upload className="h-8 w-8" />
          <span className="text-xs font-medium">Upload Photo</span>
        </button>
      </div>
    </main>
  )
}
