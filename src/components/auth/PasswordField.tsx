import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { validatePassword } from '#/lib/auth-errors'
import { Field, Input } from '#/components/ui'
import { cn } from '#/lib/cn'

/**
 * The password input and its rules in one place, used by signup, reset and
 * login.
 *
 * The rules render as a meter plus a single line naming what is still missing.
 * The old screens listed all five requirements as centred rows that appeared
 * only after the first keystroke — so the rules were invisible until you had
 * already guessed, and once visible they pushed the submit button below the
 * fold on a small phone with the keyboard up.
 */
export function PasswordField({
  value,
  onChange,
  label = 'Password',
  placeholder,
  autoComplete,
  error,
  showStrength = false,
  autoFocus = false,
  required = true,
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  autoComplete: 'current-password' | 'new-password'
  error?: string
  /** Signup and reset show the meter; login does not. */
  showStrength?: boolean
  autoFocus?: boolean
  required?: boolean
}) {
  const [visible, setVisible] = useState(false)
  const { requirements } = validatePassword(value)
  const met = requirements.filter((r) => r.met).length
  const missing = requirements.filter((r) => !r.met)

  return (
    <Field
      label={label}
      error={error}
      hint={
        showStrength ? (
          <span className="block space-y-1.5">
            <span className="flex gap-1" aria-hidden="true">
              {requirements.map((r, i) => (
                <span
                  key={r.label}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i < met
                      ? met === requirements.length
                        ? 'bg-success'
                        : 'bg-ink'
                      : 'bg-hairline',
                  )}
                />
              ))}
            </span>
            <span className={cn('block', met === requirements.length && 'text-success')}>
              {met === requirements.length
                ? 'Strong password'
                : `Needs ${missing.map(shortLabel).join(', ')}`}
            </span>
          </span>
        ) : undefined
      }
    >
      {({ id, invalid, describedBy }) => (
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required={required}
          invalid={invalid}
          aria-describedby={describedBy}
          trailing={
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition hover:text-ink"
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
      )}
    </Field>
  )
}

/** "At least 8 characters" reads fine as a row, badly in a comma list. */
function shortLabel(requirement: { label: string }): string {
  return requirement.label
    .replace(/^At least /, '')
    .replace(/^One /, '')
    .toLowerCase()
}
