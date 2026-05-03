import { createFileRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/events/join')({ component: JoinEventPage })

function JoinEventPage() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Only redirect the bare /events/join path; child routes like /events/join/$code
    // should render through <Outlet /> instead of being redirected away.
    if (location.pathname === '/events/join' || location.pathname === '/events/join/') {
      navigate({ to: '/events' })
    }
  }, [location.pathname, navigate])

  return <Outlet />
}
