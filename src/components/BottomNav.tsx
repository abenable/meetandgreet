import { Link, useRouterState } from '@tanstack/react-router'
import { Home, Calendar, Heart, MessageCircle, User } from 'lucide-react'

export default function BottomNav() {
  const router = useRouterState()
  const path = router.location.pathname

  const mainPaths = ['/discover', '/events', '/likes', '/matches', '/profile']
  const isMainScreen = mainPaths.some((p) => path === p || path.startsWith(p + '/'))

  if (!isMainScreen) return null

  const activeClass = 'text-[var(--mag-green)]'
  const inactiveClass = 'text-[var(--mag-ink-muted)]'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--mag-line)] bg-[var(--bottom-nav-bg)] backdrop-blur-lg">
      <div className="page-wrap flex items-center justify-around py-2">
        <Link to="/discover" className={`flex flex-col items-center gap-0.5 p-2 no-underline ${path === '/discover' ? activeClass : inactiveClass}`}>
          <Home className="h-6 w-6" strokeWidth={path === '/discover' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/events" className={`flex flex-col items-center gap-0.5 p-2 no-underline ${path === '/events' || path.startsWith('/events/') ? activeClass : inactiveClass}`}>
          <Calendar className="h-6 w-6" strokeWidth={path === '/events' || path.startsWith('/events/') ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Events</span>
        </Link>
        <Link to="/likes" className={`flex flex-col items-center gap-0.5 p-2 no-underline ${path === '/likes' ? activeClass : inactiveClass}`}>
          <Heart className="h-6 w-6" strokeWidth={path === '/likes' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Likes</span>
        </Link>
        <Link to="/matches" className={`flex flex-col items-center gap-0.5 p-2 no-underline ${path.startsWith('/matches') ? activeClass : inactiveClass}`}>
          <MessageCircle className="h-6 w-6" strokeWidth={path.startsWith('/matches') ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Chat</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-0.5 p-2 no-underline ${path.startsWith('/profile') ? activeClass : inactiveClass}`}>
          <User className="h-6 w-6" strokeWidth={path.startsWith('/profile') ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  )
}
