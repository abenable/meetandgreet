import { createFileRoute } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { mockLikes } from '#/lib/mock-data'

export const Route = createFileRoute('/likes')({ component: LikesPage })

function LikesPage() {
  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--mag-ink)]">Likes You</h1>
        <span className="rounded-full bg-[var(--mag-green)]/10 px-3 py-1 text-xs font-semibold text-[var(--mag-green)]">
          {mockLikes.length} likes
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {mockLikes.map((like) => (
          <div key={like.id} className="relative overflow-hidden rounded-2xl">
            <img
              src={like.photo}
              alt={like.name}
              className="aspect-[3/4] w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="text-sm font-bold text-white">{like.name}</h3>
              <p className="text-[10px] text-white/80">{like.distance}</p>
            </div>
            <button className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-green)] text-white shadow-md transition hover:scale-110">
              <Heart className="h-4 w-4 fill-white" />
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
