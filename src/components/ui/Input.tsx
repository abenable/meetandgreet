import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '#/lib/cn'

const FIELD_BASE =
  'w-full bg-field text-body text-ink placeholder:text-ink-faint ' +
  'outline-none transition hover:bg-canvas-soft ' +
  'focus:bg-field focus:ring-2 focus:ring-ink ' +
  'disabled:opacity-55 disabled:cursor-not-allowed'

const INVALID = 'ring-2 ring-danger focus:ring-danger'

export interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  aside?: ReactNode
  required?: boolean
  className?: string
  children: (props: { id: string; invalid: boolean; describedBy?: string }) => ReactNode
}

export function Field({
  label,
  hint,
  error,
  aside,
  required,
  className,
  children,
}: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-2', className)}>
      {(label || aside) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={id} className="text-body-sm font-semibold text-ink-soft">
              {label}
              {required && <span className="text-danger"> *</span>}
            </label>
          )}
          {aside && <span className="text-body-sm text-ink-muted">{aside}</span>}
        </div>
      )}
      {children({ id, invalid: !!error, describedBy })}
      {error ? (
        <p id={errorId} role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-body-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  leading?: ReactNode
  trailing?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leading, trailing, ...rest },
  ref,
) {
  const input = (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        FIELD_BASE,
        'h-11 rounded-full px-4',
        leading && 'pl-10',
        trailing && 'pr-10',
        invalid && INVALID,
        className,
      )}
      {...rest}
    />
  )

  if (!leading && !trailing) return input

  return (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-faint [&>svg]:h-4 [&>svg]:w-4">
          {leading}
        </span>
      )}
      {input}
      {trailing && (
        <span className="absolute inset-y-0 right-3 flex items-center text-ink-faint [&>svg]:h-4 [&>svg]:w-4">
          {trailing}
        </span>
      )}
    </div>
  )
})

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, rows = 4, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(
          FIELD_BASE,
          'resize-none rounded-card px-4 py-3',
          invalid && INVALID,
          className,
        )}
        {...rest}
      />
    )
  },
)
