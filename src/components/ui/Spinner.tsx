import { cn } from '#/lib/cn'

/**
 * Borrows the current text colour, so it reads correctly inside an ink button,
 * an outline button, or on a photo scrim without being told which.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  )
}
