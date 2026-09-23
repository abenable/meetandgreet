import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '#/lib/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, placeholder, children, value, ...rest },
  ref,
) {
  return (
    <div
      className={cn(
        'relative flex h-11 w-full items-center rounded-full bg-field pr-4 pl-4',
        'transition-[background-color,box-shadow] duration-200',
        'focus-within:bg-canvas-raised focus-within:shadow-md',
        'has-[select:disabled]:opacity-55',
        invalid && 'bg-danger-soft',
        className,
      )}
    >
      <select
        ref={ref}
        value={value}
        aria-invalid={invalid || undefined}
        className={cn(
          'w-full appearance-none bg-transparent pr-6 text-body outline-none',
          value === '' ? 'text-ink-faint' : 'text-ink',
        )}
        {...rest}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-ink-faint" />
    </div>
  )
})
