import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { getLikes } from '#/server/swipes'

export const Route = createFileRoute('/likes')({ component: LikesPage })

function LikesPage() {
  const { data: likes = [], isLoading } = useQuery({ queryKey: ['likes'], queryFn: () => getLikes() })

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--mag-ink)]">Likes You</h1>
        <span className="rounded-full bg-[var(--mag-green)]/10 px-3 py-1 text-xs font-semibold text-[var(--mag-green)]">{likes.length} likes</span>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" />
        </div>
      ) : likes.length === 0 ? (
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
              <button className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-green)] text-white shadow-md transition hover:scale-110">
                <Heart className="h-4 w-4 fill-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
