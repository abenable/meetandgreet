import { User } from 'lucide-react'

interface AvatarImageProps {
  src?: string | null
  alt?: string
  className?: string
  imgClassName?: string
}

export default function AvatarImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
}: AvatarImageProps) {
  const hasImage = Boolean(src && src.trim())

  if (hasImage) {
    return (
      <img
        src={src!}
        alt={alt}
        className={`h-full w-full object-cover ${imgClassName}`.trim()}
      />
    )
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[var(--mag-surface)] text-[var(--mag-ink-muted)] ${className}`.trim()}
    >
      <User className="h-[60%] w-[60%]" strokeWidth={1.5} />
    </div>
  )
}
