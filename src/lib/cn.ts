import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge only knows Tailwind's stock scales. The design system adds its
 * own steps (`rounded-card`, `text-body-sm`, `font-book`…), and without
 * registering them here a later `className` would sit *alongside* the base
 * class instead of replacing it — `text-h2` passed to a component defaulting to
 * `text-title` would lose, because the winner is decided by stylesheet order,
 * not attribute order.
 */
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
