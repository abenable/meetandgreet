import { usePWAInstall } from '#/hooks/usePWAInstall'
import { Download, X } from 'lucide-react'

export default function PWAInstallPrompt() {
  const { canInstall, dismissed, installed, prompt, dismiss } = usePWAInstall()

  if (installed || dismissed || !canInstall) return null

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+64px)] left-4 right-4 z-50">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-surface)] px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--mag-bg)] border border-[var(--mag-line)]">
          <Download className="h-5 w-5 text-[var(--mag-ink)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--mag-ink)]">
            Install Meet & Greet
          </p>
          <p className="text-xs text-[var(--mag-ink-muted)]">
            Add to your home screen for a better experience
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-full p-1.5 text-[var(--mag-ink-muted)] transition hover:bg-[var(--mag-line)]"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          onClick={() => prompt()}
          className="shrink-0 rounded-full bg-[var(--mag-ink)] px-4 py-2 text-sm font-medium text-[var(--mag-bg)] transition active:scale-95"
        >
          Install
        </button>
      </div>
    </div>
  )
}
