import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: ['rounded-card', 'rounded-media'],
      'font-size': [
        'text-display',
        'text-h1',
        'text-h2',
        'text-h3',
        'text-title',
        'text-lead',
        'text-body',
        'text-body-sm',
        'text-link',
        'text-label',
        'text-caption',
      ],
      'font-weight': ['font-book', 'font-display'],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
