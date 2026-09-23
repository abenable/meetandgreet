import { useEffect, useRef } from 'react'
import { cn } from '#/lib/cn'

const LENGTH = 6

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

    if (digits.length > 1) {
      const merged = (value.slice(0, index) + digits).slice(0, LENGTH)
      setDigits(merged, merged.length)
      return
    }

    const chars = value.padEnd(LENGTH, ' ').split('')
    chars[index] = digits
    const next = chars.join('').replace(/\D/g, '')
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
          autoComplete="one-time-code"
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={value[index] ?? ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-14 w-full min-w-0 rounded-full bg-field text-center text-h2 text-ink',
            'outline-none transition-[background-color,box-shadow] duration-200',
            'focus:bg-canvas-raised focus:shadow-md',
            'disabled:opacity-55',
            invalid && 'bg-danger-soft',
          )}
        />
      ))}
    </div>
  )
}
