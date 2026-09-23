import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '#/lib/cn'

/**
 * Replaces the hand-rolled `fixed inset-0` dialogs scattered across the
 * screens, none of which closed on Escape, locked the background scroll, or
 * told a screen reader they were modal.
 *
 * Presents as a bottom sheet on phones (thumb-reachable) and as a centred
 * dialog from 640px up.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  /** Hides the close affordance for a sheet that demands an explicit choice. */
  dismissible = true,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  dismissible?: boolean
  className?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    restoreFocusRef.current = document.activeElement as HTMLElement | null

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        event.stopPropagation()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      // Keep Tab inside the panel. Without this, focus walks off into the page
      // behind the scrim and the sheet becomes unusable by keyboard.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)

    // Focus the panel itself rather than its first control, so the sheet is
    // announced before anything is typed into.
    const raf = requestAnimationFrame(() => panelRef.current?.focus())

    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = overflow
      cancelAnimationFrame(raf)
      restoreFocusRef.current?.focus?.()
    }
  }, [open, onClose, dismissible])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div
        aria-hidden="true"
        onClick={dismissible ? onClose : undefined}
        className="fade-in absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn(
          'sheet-in relative w-full max-h-[88dvh] overflow-y-auto bg-canvas-raised outline-none',
          'rounded-t-card pb-safe px-5 pt-3 pb-6',
          'sm:mx-4 sm:max-w-sm sm:rounded-card sm:px-6 sm:pt-6',
          className,
        )}
      >
        {/* Drag handle — affordance only; the sheet closes via scrim, Escape or
            the close control. */}
        <div
          aria-hidden="true"
          className="mx-auto mb-4 h-1 w-9 rounded-full bg-hairline sm:hidden"
        />

        {(title || dismissible) && (
          <div className="mb-1 flex items-start justify-between gap-3">
            {title && <h2 className="text-h3 text-ink">{title}</h2>}
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mt-1 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-faint transition hover:bg-canvas-soft hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {description && (
          <p className="mb-4 text-body-sm text-ink-muted">{description}</p>
        )}

        {children}

        {footer && <div className="mt-6 flex gap-2">{footer}</div>}
      </div>
    </div>
  )
}
