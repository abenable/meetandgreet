import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/chats')({ component: ChatsLayout })

function ChatsLayout() {
  return <Outlet />
}
