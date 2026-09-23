import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Upload, X } from 'lucide-react'
import { getMyProfile, updateProfile } from '#/server/profiles'
import { uploadImageToR2, maybeDeleteR2Image } from '#/lib/upload'
import { PageHeader } from '#/components/PageHeader'
import { Badge, Card, Skeleton, Spinner, useToast } from '#/components/ui'

export const Route = createFileRoute('/profile/media')({ component: MediaPage })

const MAX_PHOTOS = 6

function MediaPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => getMyProfile(),
  })

  const save = useMutation({
    mutationFn: (photos: string[]) => updateProfile({ data: { photos } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      qc.invalidateQueries({ queryKey: ['swipe-deck'] })
    },
    onError: () => toast('Could not save your photos. Try again.', { tone: 'error' }),
  })

  const photos = profile?.photos ?? []
  const canAdd = photos.length < MAX_PHOTOS

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (fileRef.current) fileRef.current.value = ''
    if (!files.length || !profile) return

    const remaining = MAX_PHOTOS - photos.length
    if (remaining <= 0) return
    const accepted = files.slice(0, remaining)
    if (files.length > remaining) {
      toast(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} will fit.`)
    }

    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of accepted) {
        const key = `profiles/${profile.userId}/photo-${crypto.randomUUID()}.jpg`
        urls.push(await uploadImageToR2(file, key))
      }
      save.mutate([...photos, ...urls])
    } catch {
      toast('That upload failed. Check your connection and try again.', { tone: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = async (index: number) => {
    if (!profile) return
    const removed = photos[index]
    save.mutate(photos.filter((_, i) => i !== index))
    if (removed?.startsWith('http')) {
      await maybeDeleteR2Image(removed).catch(() => {})
    }
  }

  const movePhoto = (from: number, to: number) => {
    if (to < 0 || to >= photos.length || from === to) return
    const next = [...photos]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    save.mutate(next)
  }

  const busy = uploading || save.isPending

  return (
    <main className="page-wrap py-5 pb-28">
      <PageHeader
        title="Photos"
        back="/profile"
        action={<span className="text-body-sm text-ink-muted">{photos.length}/{MAX_PHOTOS}</span>}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-card" />
          ))}
        </div>
      ) : (
        <>
          {photos.length === 0 && (
            <Card variant="soft" className="mb-4">
              <p className="text-body-sm text-ink-muted">
                Your first photo is your avatar — it is what people see in discovery, chats and
                your friends list.
              </p>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo, i) => (
              <div
                key={`${photo}-${i}`}
                draggable={!busy}
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) movePhoto(dragIndex, i)
                  setDragIndex(null)
                }}
                className="relative aspect-[3/4] overflow-hidden rounded-card bg-canvas-soft"
              >
                <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />

                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  disabled={busy}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>

                {i === 0 && (
                  <Badge tone="overlay" className="absolute top-2 left-2">
                    Avatar
                  </Badge>
                )}

                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => movePhoto(i, i - 1)}
                    disabled={busy || i === 0}
                    aria-label={`Move photo ${i + 1} earlier`}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhoto(i, i + 1)}
                    disabled={busy || i === photos.length - 1}
                    aria-label={`Move photo ${i + 1} later`}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {canAdd && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-hairline bg-canvas-soft text-ink-muted transition hover:border-ink hover:text-ink disabled:opacity-60"
              >
                {busy ? (
                  <Spinner className="h-6 w-6" />
                ) : (
                  <>
                    <Upload className="h-6 w-6" />
                    <span className="text-body-sm">Add photo</span>
                  </>
                )}
              </button>
            )}
          </div>

          <p className="mt-4 text-center text-body-sm text-ink-faint">
            Use the arrows to reorder. The first photo is your avatar.
          </p>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </main>
  )
}
