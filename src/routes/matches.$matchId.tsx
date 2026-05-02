import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/matches/$matchId')({
  component: MatchRedirect,
})

function MatchRedirect() {
  const { matchId } = useParams({ from: '/matches/$matchId' })
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: '/chats/$chatId', params: { chatId: `match_${matchId}` } })
  }, [matchId, navigate])

  return null
}
