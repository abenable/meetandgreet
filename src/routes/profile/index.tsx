import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Briefcase, Camera, Link2, Pencil } from 'lucide-react'
import { getMyProfile, updateProfile } from '#/server/profiles'

export const Route = createFileRoute('/profile/')({ component: ProfilePage })

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function resizeImageToBase64(file: File, maxWidth = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function ProfilePage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const { data: profile } = useQuery({ queryKey: ['my-profile'], queryFn: () => getMyProfile() })

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      await updateProfile({ data: updates })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      setEditingField(null)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { authClient } = await import('#/lib/auth-client')
      await authClient.signOut()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session'] })
      window.location.href = '/login'
    },
  })

  const openEdit = (field: string, current: string) => {
    setEditingField(field)
    setEditValue(current)
  }

  const saveEdit = () => {
    if (!editingField || !profile) return
    const updates: any = {}
    if (editingField === 'bio') updates.bio = editValue
    if (editingField === 'job') updates.job = editValue
    if (editingField === 'location') updates.location = editValue
    updateMutation.mutate(updates)
  }

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploadingAvatar(true)
    try {
      const base64 = await resizeImageToBase64(file)
      const photos = [base64, ...(profile.photos || []).filter((p: string) => p !== base64)]
      await updateProfile({ data: { photos } })
      qc.invalidateQueries({ queryKey: ['my-profile'] })
    } catch {
      // silently fail
    } finally {
      setUploadingAvatar(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (!profile) {
    return (
      <main className="page-wrap flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" />
      </main>
    )
  }

  const avatarPhoto = (profile.photos || [])[0]
  const initials = getInitials(profile.name || 'You')

  return (
    <main className="page-wrap px-4 py-4">
      {/* Profile Avatar */}
      <div className="mb-4 flex flex-col items-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-[var(--mag-card)] shadow-md">
          {avatarPhoto ? (
            <img src={avatarPhoto} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--mag-green)] text-lg font-bold text-white">
              {initials}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--mag-green)] text-white shadow-sm transition hover:scale-105 disabled:opacity-60"
          >
            {uploadingAvatar ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFile}
          />
        </div>
        <h2 className="mt-3 text-xl font-bold text-[var(--mag-ink)]">{profile.name || 'You'}</h2>
        <div className="mt-0.5 inline-flex items-center gap-1 text-sm text-[var(--mag-ink-soft)]">
          <MapPin className="h-3.5 w-3.5" />
          <span>{profile.location || 'Add your city'}</span>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="mb-5 flex w-full justify-center gap-4 overflow-x-auto hide-scrollbar pb-2">
        <div className="flex gap-4">
          {(profile.photos || []).map((photo: string, i: number) => (
            <div key={i} className="relative h-56 w-56 flex-shrink-0 overflow-hidden rounded-2xl">
              <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            </div>
          ))}
          <Link
            to="/profile/media"
            className="flex h-56 w-56 flex-shrink-0 flex-col items-center justify-center gap-2 rounded-2xl bg-[var(--mag-green)] text-white dark:text-black transition hover:opacity-90 no-underline"
          >
            <Camera className="h-8 w-8" />
            <span className="text-xs font-medium">Add</span>
          </Link>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {(profile.interests || []).map((interest: string) => (
          <span key={interest} className="rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-3 py-1.5 text-xs font-medium text-[var(--mag-ink)]">{interest}</span>
        ))}
        <button className="rounded-full border border-dashed border-[var(--mag-line)] px-3 py-1.5 text-xs font-medium text-[var(--mag-ink-muted)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)]">+ Add</button>
      </div>

      <div onClick={() => openEdit('bio', profile.bio || '')} className="mb-4 cursor-pointer rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 card-shadow transition hover:border-[var(--mag-green)]/30">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--mag-ink)]">About Me</h3>
          <Pencil className="h-3 w-3 text-[var(--mag-ink-muted)]" />
        </div>
        <p className="text-sm leading-relaxed text-[var(--mag-ink-soft)]">{profile.bio || 'Add a bio'}</p>
      </div>

      <div onClick={() => openEdit('job', profile.job || '')} className="mb-4 cursor-pointer rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 card-shadow transition hover:border-[var(--mag-green)]/30">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--mag-ink)]">Work</h3>
          <Pencil className="h-3 w-3 text-[var(--mag-ink-muted)]" />
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--mag-ink-soft)]">
          <Briefcase className="h-4 w-4 text-[var(--mag-ink-muted)]" /><span>{profile.job || 'Add your job title'}</span>
        </div>
      </div>

      <div onClick={() => openEdit('location', profile.location || '')} className="mb-4 cursor-pointer rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 card-shadow transition hover:border-[var(--mag-green)]/30">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--mag-ink)]">Location</h3>
          <Pencil className="h-3 w-3 text-[var(--mag-ink-muted)]" />
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--mag-ink-soft)]">
          <MapPin className="h-4 w-4 text-[var(--mag-ink-muted)]" /><span>{profile.location || 'Add your city'}</span>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 card-shadow">
        <h3 className="mb-2 text-sm font-semibold text-[var(--mag-ink)]">Gender</h3>
        <div className="flex flex-wrap gap-2">
          {['Woman', 'Man', 'Non-binary'].map((g) => (
            <span key={g} className={`rounded-full px-4 py-2 text-xs font-medium ${g === profile.gender ? 'bg-[var(--mag-green)] text-white' : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink)]'}`}>{g}</span>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
        <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-6 py-2.5 text-sm font-semibold text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)] card-shadow">
          <Link2 className="h-4 w-4" />Share Profile
        </button>
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/20 disabled:opacity-60"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Log Out
        </button>
      </div>

      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold text-[var(--mag-ink)]">{editingField === 'bio' ? 'About Me' : editingField === 'job' ? 'Job Title' : 'Location'}</h3>
            <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={editingField === 'bio' ? 4 : 1}
              className="mb-4 w-full resize-none rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] p-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20" />
            <div className="flex gap-2">
              <button onClick={() => setEditingField(null)} className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]">Cancel</button>
              <button onClick={saveEdit} disabled={updateMutation.isPending} className="flex-1 rounded-full bg-[var(--mag-green)] py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--mag-green-dark)] disabled:opacity-60">{updateMutation.isPending ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
