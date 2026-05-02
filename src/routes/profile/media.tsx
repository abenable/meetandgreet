import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Upload, X, GripVertical } from 'lucide-react'
import { getMyProfile, updateProfile } from '#/server/profiles'
import { uploadImageToR2, maybeDeleteR2Image } from '#/lib/upload'

export const Route = createFileRoute('/profile/media')({ component: MediaPage })

function MediaPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const { data: profile } = useQuery({ queryKey: ['my-profile'], queryFn: () => getMyProfile() })
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const updateMutation = useMutation({
    mutationFn: async (photos: string[]) => {
      await updateProfile({ data: { photos } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  })

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !profile) return
    const existing = profile.photos || []
    const remaining = Math.max(0, 6 - existing.length)
    if (remaining === 0) return

    const urls = await Promise.all(
      files.slice(0, remaining).map(async (f) => {
        const key = `profiles/${profile.userId}/photo-${crypto.randomUUID()}.jpg`
        return uploadImageToR2(f, key)
      }),
    )
    updateMutation.mutate([...existing, ...urls])
    if (fileRef.current) fileRef.current.value = ''
  }

  const removePhoto = async (index: number) => {
    if (!profile) return
    const removed = profile.photos[index]
    const photos = (profile.photos || []).filter((_, i) => i !== index)
    updateMutation.mutate(photos)
    if (removed?.startsWith('http')) {
      await maybeDeleteR2Image(removed).catch(() => {})
    }
  }

  const movePhoto = (from: number, to: number) => {
    if (!profile) return
    const photos = [...(profile.photos || [])]
    const [moved] = photos.splice(from, 1)
    photos.splice(to, 0, moved)
    updateMutation.mutate(photos)
  }

  const photos = profile?.photos || []
  const canAdd = photos.length < 6

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-5 flex items-center gap-2">
        <button onClick={() => navigate({ to: '/profile' })} className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">My Photos</h1>
        <span className="ml-auto text-xs text-[var(--mag-ink-muted)]">{photos.length}/6</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo: string, i: number) => (
          <div
            key={`${photo.slice(-20)}-${i}`}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null && dragIndex !== i) movePhoto(dragIndex, i)
              setDragIndex(null)
            }}
            className="relative aspect-[3/4] overflow-hidden rounded-2xl"
          >
            <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <div className="absolute top-2 left-2 flex h-7 w-7 cursor-grab items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm active:cursor-grabbing">
              <GripVertical className="h-3.5 w-3.5" />
            </div>
            <button
              onClick={() => removePhoto(i)}
              disabled={updateMutation.isPending}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {i === 0 && (
              <div className="absolute bottom-2 left-2 rounded-full bg-[var(--mag-green)] px-2 py-0.5 text-[10px] font-bold text-white">
                Avatar
              </div>
            )}
          </div>
        ))}

        {canAdd && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={updateMutation.isPending}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--mag-line)] bg-[var(--mag-surface)] text-[var(--mag-ink-muted)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)] disabled:opacity-60"
          >
            {updateMutation.isPending ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" />
            ) : (
              <>
                <Upload className="h-8 w-8" />
                <span className="text-xs font-medium">Upload Photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFile}
      />

      <p className="mt-4 text-center text-xs text-[var(--mag-ink-muted)]">
        First photo is your avatar. Drag to reorder.
      </p>
    </main>
  )
}
