import { User } from 'lucide-react'
import { cn } from '#/lib/cn'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZES: Record<AvatarSize, string> = {
  xs: 'h-7 w-7',
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
}

const DOT_SIZES: Record<AvatarSize, string> = {
  xs: 'h-2 w-2',
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
  xl: 'h-4 w-4',
}

export interface AvatarProps {
  src?: string | null
  alt?: string
  size?: AvatarSize
  square?: boolean
  online?: boolean
  obscured?: boolean
  priority?: boolean
  className?: string
}

export function Avatar({
  src,
  alt = '',
  size = 'md',
  square = false,
  online,
  obscured = false,
  priority = false,
  className,
}: AvatarProps) {
  const hasImage = Boolean(src && src.trim())

  return (
    <span className={cn('relative inline-block shrink-0', SIZES[size], className)}>
      <span
        className={cn(
          'block h-full w-full overflow-hidden bg-canvas-soft',
          square ? 'rounded-media' : 'rounded-full',
        )}
      >
        {hasImage ? (
          <img
            src={src!}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            draggable={false}
            className={cn(
              'h-full w-full object-cover',
              obscured && 'blur-[18px] grayscale-[0.5]',
            )}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-ink-faint">
            <User className="h-[58%] w-[58%]" strokeWidth={1.5} />
          </span>
        )}
      </span>
      {online !== undefined && (
        <span
          aria-label={online ? 'Active now' : 'Offline'}
          className={cn(
            'absolute right-0 bottom-0 rounded-full ring-2 ring-canvas',
            DOT_SIZES[size],
            online ? 'bg-success' : 'bg-ink-faint',
          )}
        />
      )}
    </span>
  )
}
