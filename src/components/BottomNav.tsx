import { Link, useRouterState } from '@tanstack/react-router'
import { Home, Calendar, Heart, MessageCircle, Settings } from 'lucide-react'

export default function BottomNav() {
  const router = useRouterState()
  const path = router.location.pathname

  const items = [
    { to: '/discover', label: 'Home', icon: Home },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/likes', label: 'Likes', icon: Heart },
    { to: '/chats', label: 'Chat', icon: MessageCircle },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--mag-line)] bg-[var(--bottom-nav-bg)] backdrop-blur-lg">
      <div className="page-wrap flex items-center justify-around py-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to || path.startsWith(to + '/')
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 p-2 no-underline ${active ? 'text-[var(--mag-ink)]' : 'text-[var(--mag-ink-muted)]'}`}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
