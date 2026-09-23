import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban } from 'lucide-react'
import { getBlockedUsers, unblockUser } from '#/server/blocks'
import { PageHeader } from '#/components/PageHeader'
import { Avatar, Button, EmptyState, Skeleton, useToast } from '#/components/ui'

export const Route = createFileRoute('/settings/blocked')({ component: BlockedUsersPage })

function BlockedUsersPage() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: blockedUsers = [], isLoading } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => getBlockedUsers(),
  })

  const unblock = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocked-users'] })
      qc.invalidateQueries({ queryKey: ['swipe-deck'] })
      qc.invalidateQueries({ queryKey: ['friends'] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      toast('Unblocked')
    },
    onError: () => toast('Could not unblock. Try again.', { tone: 'error' }),
  })

  return (
    <main className="page-wrap py-5 pb-28">
      <PageHeader title="Blocked accounts" back="/settings" />

      {isLoading ? (
        <ul>
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex items-center gap-3 border-b border-hairline-soft py-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-28 rounded-full" />
                <Skeleton className="h-3 w-20 rounded-full" />
              </div>
              <Skeleton className="h-9 w-24 rounded-full" />
            </li>
          ))}
        </ul>
      ) : blockedUsers.length === 0 ? (
        <EmptyState
          icon={Ban}
          title="Nobody blocked"
          description="Blocking someone hides you from each other everywhere in the app."
        />
      ) : (
        <ul>
          {blockedUsers.map((user) => (
            <li
              key={user.userId}
              className="flex items-center gap-3 border-b border-hairline-soft py-3"
            >
              <Avatar src={user.photo} alt={user.name ?? ''} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-title text-ink">{user.name}</p>
                <p className="text-body-sm text-ink-muted" suppressHydrationWarning>
                  Blocked {new Date(user.blockedAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                loading={unblock.isPending && unblock.variables?.data === user.userId}
                onClick={() => unblock.mutate({ data: user.userId })}
              >
                Unblock
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
