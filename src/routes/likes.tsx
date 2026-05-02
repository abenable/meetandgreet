import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Heart, MessageCircle, Users } from 'lucide-react'
import { getLikes, getMatches } from '#/server/swipes'

export const Route = createFileRoute('/likes')({ component: LikesPage })

type Tab = 'likes' | 'matches'

function LikesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('likes')
  const { data: likes = [], isLoading: likesLoading } = useQuery({ queryKey: ['likes'], queryFn: () => getLikes() })
  const { data: matches = [], isLoading: matchesLoading } = useQuery({ queryKey: ['matches'], queryFn: () => getMatches() })

  const isLoading = likesLoading || matchesLoading

  return (
    <div className="page-wrap flex flex-1 flex-col px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--mag-ink)]">Connections</h1>
        <span className="rounded-full bg-[var(--mag-green)]/10 px-3 py-1 text-xs font-semibold text-[var(--mag-green)]">
          {likes.length + matches.length} total
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1 rounded-xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-1">
        {([
          { key: 'likes' as Tab, label: 'Likes You', count: likes.length, icon: Heart },
          { key: 'matches' as Tab, label: 'Matches', count: matches.length, icon: Users },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${
              activeTab === t.key
                ? 'bg-[var(--mag-green)] text-white'
                : 'text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)]'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span>{t.label}</span>
            <span className={`rounded-full px-1.5 py-0 text-[10px] ${activeTab === t.key ? 'bg-white/20' : 'bg-[var(--mag-surface)]'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" />
        </div>
      ) : activeTab === 'likes' ? (
        likes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--mag-line)] bg-[var(--mag-card)] p-8 text-center">
            <Heart className="mx-auto mb-2 h-8 w-8 text-[var(--mag-ink-muted)]" />
            <p className="text-sm text-[var(--mag-ink-soft)]">No likes yet. Keep discovering!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {likes.map((like: any) => (
              <div key={like.id} className="relative overflow-hidden rounded-2xl">
                <img src={(like.photos || [])[0] || ''} alt={like.name} className="aspect-[3/4] w-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-sm font-bold text-white">{like.name}</h3>
                  <p className="text-[10px] text-white/80">{like.location}</p>
                </div>
                <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-green)] text-white shadow-md">
                  <Heart className="h-4 w-4 fill-white" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--mag-line)] bg-[var(--mag-card)] p-8 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-[var(--mag-ink-muted)]" />
            <p className="text-sm text-[var(--mag-ink-soft)]">No matches yet. Start swiping!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match: any) => (
              <Link
                key={match.id}
                to="/chats/$chatId"
                params={{ chatId: `match_${match.id}` }}
                className="flex items-center gap-3 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-3 transition hover:border-[var(--mag-green)] no-underline card-shadow"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[var(--mag-line)]">
                  {match.peerPhoto ? (
                    <img src={match.peerPhoto} alt={match.peerName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--mag-ink-muted)]">
                      {match.peerName?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[var(--mag-ink)]">{match.peerName}</h3>
                  <p className="truncate text-xs text-[var(--mag-ink-soft)]">{match.lastMessage || 'New match!'}</p>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--mag-green)] text-white">
                  <MessageCircle className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
