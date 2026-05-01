import { usePWAInstall } from '#/hooks/usePWAInstall'
import { Download, X } from 'lucide-react'

export default function PWAInstallPrompt() {
  const { canInstall, dismissed, installed, prompt, dismiss } = usePWAInstall()

  if (installed || dismissed || !canInstall) return null

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+64px)] left-4 right-4 z-50">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-surface)] px-4 py-3 shadow-lg">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--mag-green-soft)]">
          <Download className="h-5 w-5 text-[var(--mag-green)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--mag-ink)]">
            Install Meet & Greet
          </p>
          <p className="text-xs text-[var(--mag-ink-muted)]">
            Add to your home screen for a better experience
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-full p-1.5 text-[var(--mag-ink-muted)] transition hover:bg-[var(--mag-hover)]"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          onClick={() => prompt()}
          className="shrink-0 rounded-lg bg-[var(--mag-green)] px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
        >
          Install
        </button>
      </div>
    </div>
  )
}
