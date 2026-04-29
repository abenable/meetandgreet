import { createFileRoute, Link } from '@tanstack/react-router'
import { Search, SlidersHorizontal } from 'lucide-react'
import { mockMatches } from '#/lib/mock-data'

export const Route = createFileRoute('/matches/')({ component: MatchesPage })

function MatchesPage() {
  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--mag-ink)]">Messages</h1>
        <button className="rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)]">
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mag-ink-muted)]" />
        <input
          type="text"
          placeholder="Search matches"
          className="w-full rounded-full border border-[var(--mag-line)] bg-[var(--input-bg)] py-2.5 pl-10 pr-4 text-sm text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
        />
      </div>

      <div className="space-y-1">
        {mockMatches.map((match) => (
          <Link
            key={match.id}
            to="/matches/$matchId"
            params={{ matchId: match.matchId }}
            className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-[var(--mag-surface)] no-underline"
          >
            <div className="relative flex-shrink-0">
              <img
                src={match.avatar}
                alt={match.name}
                className="h-14 w-14 rounded-full object-cover"
              />
              {match.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--mag-green)] text-[10px] font-bold text-white">
                  {match.unread}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--mag-ink)]">
                  {match.name}
                </h3>
                <span className="text-[10px] text-[var(--mag-ink-muted)]">{match.timestamp}</span>
              </div>
              <p className={`mt-0.5 truncate text-xs ${match.unread > 0 ? 'font-semibold text-[var(--mag-ink)]' : 'text-[var(--mag-ink-soft)]'}`}>
                {match.lastMessage}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
