import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '#/lib/cn'

/**
 * Fields carry no border at rest — they are a tint fill. The border appears
 * only as the focus ring, and that ring is ink, not a colour.
 */
const FIELD_BASE =
  'w-full rounded-media bg-field text-body text-ink placeholder:text-ink-faint ' +
  'border border-transparent outline-none transition ' +
  'focus:border-ink focus:ring-1 focus:ring-ink ' +
  'disabled:opacity-55 disabled:cursor-not-allowed'

const INVALID = 'border-danger focus:border-danger focus:ring-danger'

export interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  /** Rendered at the right of the label row — a character counter, say. */
  aside?: ReactNode
  required?: boolean
  className?: string
  children: (props: { id: string; invalid: boolean; describedBy?: string }) => ReactNode
}

/**
 * Owns the label/hint/error wiring so every form in the app reports errors to
 * assistive tech the same way, instead of each screen scattering its own
 * unassociated red paragraph.
 */
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
    <div className={cn('space-y-1.5', className)}>
      {(label || aside) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={id} className="text-label text-ink-muted">
              {label}
              {required && <span className="text-danger"> *</span>}
            </label>
          )}
          {aside && <span className="text-caption text-ink-faint">{aside}</span>}
        </div>
      )}
      {children({ id, invalid: !!error, describedBy })}
      {error ? (
        <p id={errorId} role="alert" className="text-caption text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-caption text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  /** Icon or control rendered inside the field, before the text. */
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
        'h-11 px-4',
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
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint [&>svg]:h-4 [&>svg]:w-4">
          {leading}
        </span>
      )}
      {input}
      {trailing && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint [&>svg]:h-4 [&>svg]:w-4">
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
          'resize-none px-4 py-3',
          invalid && INVALID,
          className,
        )}
        {...rest}
      />
    )
  },
)
