import { Link, useRouterState } from '@tanstack/react-router'
import { Flame, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Header() {
  const router = useRouterState()
  const path = router.location.pathname
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const hideHeaderPaths = ['/login', '/onboarding']
  if (hideHeaderPaths.includes(path)) return null

  const toggle = () => {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('mag-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('mag-theme', 'light')
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--mag-line)] bg-[var(--header-bg)] backdrop-blur-lg">
      <div className="page-wrap flex items-center justify-between py-3">
        <div className="w-9" />
        <Link to="/" className="flex items-center gap-1.5 text-[var(--mag-green)] no-underline">
          <Flame className="h-6 w-6 fill-[var(--mag-green)] text-[var(--mag-green)]" />
          <span className="text-lg font-bold tracking-tight text-[var(--mag-ink)]">Meet & Greet</span>
        </Link>
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  )
}
