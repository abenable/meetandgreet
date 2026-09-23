import { Link, useRouterState, getRouteApi } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Home, Calendar, Users, MessageCircle, Settings } from 'lucide-react'
import { getPendingRequestCount } from '#/server/friends'
import { cn } from '#/lib/cn'

const rootRoute = getRouteApi('__root__')

export default function BottomNav() {
  const router = useRouterState()
  const path = router.location.pathname
  const { session } = rootRoute.useRouteContext()

  const { data: pendingRequests = 0 } = useQuery({
    queryKey: ['pending-request-count'],
    queryFn: () => getPendingRequestCount(),
    enabled: !!session?.user,
    refetchInterval: 60000,
  })

  const items = [
    { to: '/discover', label: 'Home', icon: Home, badge: 0 },
    { to: '/events', label: 'Events', icon: Calendar, badge: 0 },
    { to: '/friends', label: 'Friends', icon: Users, badge: pendingRequests },
    { to: '/chats', label: 'Chats', icon: MessageCircle, badge: 0 },
    { to: '/settings', label: 'Settings', icon: Settings, badge: 0 },
  ]

  return (
    <nav className="chrome-blur fixed inset-x-0 bottom-0 z-50 pb-safe shadow-[0_-1px_12px_rgba(16,16,22,0.06)]">
      <div className="page-wrap flex items-center justify-around py-1">
        {items.map(({ to, label, icon: Icon, badge }) => {
          const active = path === to || path.startsWith(to + '/')
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'relative flex min-w-14 flex-col items-center gap-0.5 p-2 no-underline transition',
                active ? 'text-ink' : 'text-ink-faint',
              )}
            >
              <span className="relative">
                <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.9} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-contrast tabular-nums">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className="text-caption">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
