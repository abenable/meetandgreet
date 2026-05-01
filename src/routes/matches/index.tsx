import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getMatches } from '#/server/swipes'

export const Route = createFileRoute('/matches/')({ component: MatchesPage })

function MatchesPage() {
  const { data: matches = [], isLoading } = useQuery({ queryKey: ['matches'], queryFn: () => getMatches() })

  return (
    <div className="page-wrap flex flex-1 flex-col px-4 py-4">
      <h1 className="mb-4 text-xl font-bold text-[var(--mag-ink)]">Messages</h1>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" />
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--mag-line)] bg-[var(--mag-card)] p-8 text-center">
          <p className="text-sm text-[var(--mag-ink-soft)]">No matches yet. Start swiping!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match: any) => (
            <Link key={match.id} to="/matches/$matchId" params={{ matchId: match.id }} className="flex items-center gap-3 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-3 transition hover:border-[var(--mag-green)] no-underline card-shadow">
              <img src={match.peerPhoto || ''} alt={match.peerName} className="h-14 w-14 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-[var(--mag-ink)]">{match.peerName}</h3>
                <p className="truncate text-xs text-[var(--mag-ink-soft)]">{match.lastMessage || 'New match!'}</p>
              </div>
              <span className="shrink-0 text-[10px] text-[var(--mag-ink-muted)]" suppressHydrationWarning>{new Date(match.lastMessageAt).toLocaleDateString()}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
