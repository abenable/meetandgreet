import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/events/join')({ component: JoinEventPage })

function JoinEventPage() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate({ to: '/events' })
  }, [navigate])
  return null
}
