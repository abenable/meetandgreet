import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Ban, X } from 'lucide-react'
import { getBlockedUsers, unblockUser } from '#/server/blocks'
import AvatarImage from '#/components/AvatarImage'

export const Route = createFileRoute('/settings/blocked')({ component: BlockedUsersPage })

function BlockedUsersPage() {
  const qc = useQueryClient()
  const { data: blockedUsers = [], isLoading } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => getBlockedUsers(),
  })

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocked-users'] })
      qc.invalidateQueries({ queryKey: ['event-profiles'] })
      qc.invalidateQueries({ queryKey: ['event-attendees'] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['matches'] })
    },
  })

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-5 text-center">
        <Link to="/settings" className="absolute left-4 top-4 rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)] no-underline">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-[var(--mag-ink)]">Blocked Users</h1>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#111111] border-t-transparent" />
        </div>
      ) : blockedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Ban className="mb-4 h-12 w-12 text-[var(--mag-ink-muted)]" />
          <p className="text-sm text-[var(--mag-ink-soft)]">You haven't blocked anyone</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blockedUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-3 rounded-none border border-[var(--mag-line)] bg-[var(--mag-card)] px-4 py-3"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--mag-line)]">
                <AvatarImage src={user.photo ?? ''} alt={user.name ?? ''} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--mag-ink)]">
                  {user.name}
                </p>
                <p className="text-xs text-[var(--mag-ink-muted)]">
                  Blocked {new Date(user.blockedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => unblockMutation.mutate({ data: user.userId })}
                disabled={unblockMutation.isPending}
                className="flex items-center gap-1.5 rounded-full border border-[var(--mag-line)] bg-[var(--mag-surface)] px-3 py-1.5 text-xs font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-line)] disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
