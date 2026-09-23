import { cn } from '#/lib/cn'

/**
 * Replaces @heroui/react's Skeleton, whose greys were fixed and did not follow
 * the palette in either theme. The shimmer here runs across the tint ladder.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('shimmer rounded-media', className)}
    />
  )
}

/** A stack of text-line placeholders with a short last line, which reads as
 *  copy rather than as blocks. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3 rounded-full', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}
