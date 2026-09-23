import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '#/lib/cn'
import { Spinner } from './Spinner'

export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'soft'
  | 'ghost'
  | 'danger'
  | 'scrim'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-on-ink hover:opacity-85',
  outline: 'bg-canvas text-ink border border-hairline hover:bg-canvas-soft',
  soft: 'bg-canvas-soft text-ink hover:bg-field',
  ghost: 'bg-transparent text-ink-muted hover:bg-canvas-soft hover:text-ink',
  danger: 'bg-danger text-white hover:opacity-85',
  scrim:
    'bg-black/35 text-on-scrim border border-white/20 backdrop-blur-sm hover:bg-black/50',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-label gap-1.5',
  md: 'h-11 px-5 text-link gap-2',
  lg: 'h-12 px-6 text-link gap-2',
}

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 w-9 p-0',
  md: 'h-11 w-11 p-0',
  lg: 'h-12 w-12 p-0',
}

export interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: boolean
  block?: boolean
  className?: string
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  icon = false,
  block = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-full whitespace-nowrap no-underline select-none',
    'transition active:scale-[0.97]',
    'disabled:pointer-events-none disabled:opacity-45',
    VARIANTS[variant],
    icon ? ICON_SIZES[size] : SIZES[size],
    block && 'w-full',
    className,
  )
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonStyleOptions {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      icon = false,
      block = false,
      loading = false,
      className,
      disabled,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClasses({ variant, size, icon, block, className })}
        {...rest}
      >
        {loading ? <Spinner /> : children}
      </button>
    )
  },
)
