import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Camera, GripVertical, X, ImagePlus } from 'lucide-react'
import { myProfile } from '#/lib/mock-data'

export const Route = createFileRoute('/profile/media')({ component: MediaPage })

function MediaPage() {
  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <a href="/profile/edit" className="rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)] no-underline">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Photos & Videos</h1>
      </div>

      <p className="mb-4 text-xs text-[var(--mag-ink-muted)]">
        Drag to reorder. Tap X to remove.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {myProfile.photos.map((photo, i) => (
          <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-xl">
            <img src={photo} alt={`Media ${i + 1}`} className="h-full w-full object-cover" />
            <div className="absolute top-1 left-1 flex h-6 w-6 cursor-move items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
              <GripVertical className="h-3 w-3" />
            </div>
            <button className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-red-500">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--mag-line)] bg-[var(--mag-surface)] text-[var(--mag-ink-muted)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)]">
          <ImagePlus className="h-6 w-6" />
          <span className="text-[10px] font-medium">Add Photo</span>
        </button>
        <button className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--mag-line)] bg-[var(--mag-surface)] text-[var(--mag-ink-muted)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)]">
          <Camera className="h-6 w-6" />
          <span className="text-[10px] font-medium">Add Video</span>
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-[var(--mag-ink-muted)]">
        {myProfile.photos.length}/9 selected
      </p>
    </main>
  )
}
