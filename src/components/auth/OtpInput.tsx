import { useEffect, useRef } from 'react'
import { cn } from '#/lib/cn'

const LENGTH = 6

/**
 * Six boxes rather than one text field with letter-spacing.
 *
 * The old single input set `tracking-[0.5em]`, which spaced the `000000`
 * placeholder too, so the placeholder digits sat offset from where typed
 * digits landed. It also carried no `one-time-code` hint, so iOS never offered
 * the emailed code from the keyboard bar, and nothing submitted when the sixth
 * digit arrived.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  invalid = false,
  disabled = false,
  autoFocus = true,
  label = 'Verification code',
}: {
  value: string
  onChange: (value: string) => void
  /** Fired once the sixth digit lands, so the form can submit itself. */
  onComplete?: (value: string) => void
  invalid?: boolean
  disabled?: boolean
  autoFocus?: boolean
  label?: string
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const completedFor = useRef<string | null>(null)

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (value.length !== LENGTH) {
      completedFor.current = null
      return
    }
    // Guard against re-firing for a value we already reported — otherwise a
    // re-render after a failed submit would submit again.
    if (completedFor.current === value) return
    completedFor.current = value
    onComplete?.(value)
  }, [value, onComplete])

  const setDigits = (next: string, focusIndex?: number) => {
    const clean = next.replace(/\D/g, '').slice(0, LENGTH)
    onChange(clean)
    if (focusIndex !== undefined) {
      const target = Math.min(focusIndex, LENGTH - 1)
      refs.current[target]?.focus()
      refs.current[target]?.select()
    }
  }

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return

    // One input can receive several characters at once — a paste, or iOS
    // filling the whole code from the keyboard bar into whichever box has
    // focus. Spread them across the boxes from here rather than truncating.
    if (digits.length > 1) {
      const merged = (value.slice(0, index) + digits).slice(0, LENGTH)
      setDigits(merged, merged.length)
      return
    }

    const chars = value.padEnd(LENGTH, ' ').split('')
    chars[index] = digits
    const next = chars.join('').replace(/\D/g, '')
    // Focus follows the end of the value, not index+1: tapping an empty box
    // further along still lands the digit in the first free slot, so focus has
    // to go there too rather than skipping past it.
    setDigits(next, next.length)
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      if (value[index]) {
        const chars = value.split('')
        chars[index] = ''
        setDigits(chars.join(''), index)
      } else if (index > 0) {
        const chars = value.split('')
        chars[index - 1] = ''
        setDigits(chars.join(''), index - 1)
      }
      return
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      refs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < LENGTH - 1) {
      event.preventDefault()
      refs.current[index + 1]?.focus()
    }
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center justify-between gap-2"
    >
      {Array.from({ length: LENGTH }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          // Every box carries the hint: autofill targets whichever one has
          // focus, and handleChange spreads the full code from there.
          autoComplete="one-time-code"
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={value[index] ?? ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-14 w-full min-w-0 rounded-media bg-field text-center text-h2 text-ink',
            'border border-transparent outline-none transition',
            'focus:border-ink focus:ring-1 focus:ring-ink',
            'disabled:opacity-55',
            invalid && 'border-danger focus:border-danger focus:ring-danger',
          )}
        />
      ))}
    </div>
  )
}
