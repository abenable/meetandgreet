import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/likes')({
  beforeLoad: () => {
    throw redirect({ to: '/friends' })
  },
})
