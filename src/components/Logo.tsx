interface LogoProps {
  className?: string
}

export default function Logo({ className = 'h-8 w-auto' }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Meet & Greet"
      className={`object-contain ${className}`}
    />
  )
}
