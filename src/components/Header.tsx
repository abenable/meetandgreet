import { Link, useRouterState, getRouteApi } from '@tanstack/react-router'
import { Moon, Sun, User, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUnreadNotificationCount } from '#/server/notifications'
import Logo from './Logo'

const rootRoute = getRouteApi('__root__')

export default function Header() {
  const router = useRouterState()
  const path = router.location.pathname
  const [dark, setDark] = useState(false)
  const { session } = rootRoute.useRouteContext()
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: () => getUnreadNotificationCount(),
    enabled: !!session?.user,
    refetchInterval: 30000,
  })

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const hideHeaderPaths = ['/login', '/signup', '/forgot-password']
  const isAuthScreen = hideHeaderPaths.some((p) => path === p || path.startsWith(p + '/'))
  if (isAuthScreen) return null

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
        {session?.user ? (
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--mag-surface)] text-[var(--mag-ink-soft)]"
            >
              {session.user.image ? (
                <img src={session.user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </Link>
          </div>
        ) : (
          <div className="w-9" />
        )}
        <Link to="/" className="flex items-center gap-1.5 text-[var(--mag-green)] no-underline">
          <Logo className="h-6 w-auto" />
          <span className="text-lg font-bold tracking-tight text-[var(--mag-ink)]">Meet & Greet</span>
        </Link>
        <div className="flex items-center gap-1">
          {session?.user && (
            <Link
              to="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  )
}
