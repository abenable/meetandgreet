import type { HTMLAttributes } from 'react'
import { cn } from '#/lib/cn'

export type CardVariant = 'plain' | 'soft' | 'inverse' | 'dashed'

/**
 * Elevation levels 1–3 from DESIGN.md. There is no shadow variant on purpose:
 * hierarchy is fill difference and hairlines.
 */
const VARIANTS: Record<CardVariant, string> = {
  plain: 'bg-canvas-raised border border-hairline-soft',
  soft: 'bg-canvas-soft',
  inverse: 'bg-ink text-on-ink',
  dashed: 'bg-canvas-raised border border-dashed border-hairline',
}

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: keyof typeof PADDING
}

export function Card({
  variant = 'plain',
  padding = 'md',
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card overflow-hidden',
        VARIANTS[variant],
        PADDING[padding],
        className,
      )}
      {...rest}
    />
  )
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-h3 text-ink', className)} {...rest} />
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-body-sm text-ink-muted', className)} {...rest} />
}
