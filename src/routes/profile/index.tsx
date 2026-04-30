import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Briefcase, Camera, Link2 } from 'lucide-react'
import { getMyProfile, updateProfile } from '#/server/profiles'

export const Route = createFileRoute('/profile/')({ component: ProfilePage })

function ProfilePage() {
  const qc = useQueryClient()
  const { data: profile } = useQuery({ queryKey: ['my-profile'], queryFn: () => getMyProfile() })

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const openEdit = (field: string, current: string) => {
    setEditingField(field)
    setEditValue(current)
  }

  const saveEdit = async () => {
    if (!editingField || !profile) return
    const updates: any = {}
    if (editingField === 'bio') updates.bio = editValue
    if (editingField === 'job') updates.job = editValue
    if (editingField === 'location') updates.location = editValue
    await updateProfile({ data: updates })
    setEditingField(null)
    qc.invalidateQueries({ queryKey: ['my-profile'] })
  }

  if (!profile) {
    return (
      <main className="page-wrap flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" />
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 py-4">
      {/* Profile Avatar */}
      <div className="mb-4 flex flex-col items-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-[var(--mag-card)] shadow-md">
          <img
            src={(profile.photos || [])[0] || ''}
            alt="Profile"
            className="h-full w-full object-cover"
          />
          <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--mag-green)] text-white shadow-sm transition hover:scale-105">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <h2 className="mt-3 text-xl font-bold text-[var(--mag-ink)]">{profile.name || 'You'}</h2>
        <div className="mt-0.5 inline-flex items-center gap-1 text-sm text-[var(--mag-ink-soft)]">
          <MapPin className="h-3.5 w-3.5" />
          <span>{profile.location || 'Add your city'}</span>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="mb-5 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {(profile.photos || []).map((photo, i) => (
          <div key={i} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
            <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
          </div>
        ))}
        <button className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-[var(--mag-line)] bg-[var(--mag-surface)] text-[var(--mag-ink-muted)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)]">
          <Camera className="h-4 w-4" />
          <span className="text-[9px] font-medium">Add</span>
        </button>
      </div>

      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {(profile.interests || []).map((interest) => (
          <span key={interest} className="rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-3 py-1.5 text-xs font-medium text-[var(--mag-ink)]">{interest}</span>
        ))}
        <button className="rounded-full border border-dashed border-[var(--mag-line)] px-3 py-1.5 text-xs font-medium text-[var(--mag-ink-muted)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)]">+ Add</button>
      </div>

      <div className="mb-4 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 card-shadow">
        <h3 className="mb-2 text-sm font-semibold text-[var(--mag-ink)]">About Me</h3>
        <p className="text-sm leading-relaxed text-[var(--mag-ink-soft)]">{profile.bio || 'Add a bio'}</p>
      </div>

      <div className="mb-4 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 card-shadow">
        <h3 className="mb-2 text-sm font-semibold text-[var(--mag-ink)]">Work</h3>
        <div className="flex items-center gap-2 text-sm text-[var(--mag-ink-soft)]">
          <Briefcase className="h-4 w-4 text-[var(--mag-ink-muted)]" /><span>{profile.job || 'Add your job title'}</span>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 card-shadow">
        <h3 className="mb-2 text-sm font-semibold text-[var(--mag-ink)]">Location</h3>
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
        <button onClick={() => { localStorage.removeItem('mag-session'); window.location.href = '/login' }} className="inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/20">
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
              <button onClick={saveEdit} className="flex-1 rounded-full bg-[var(--mag-green)] py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--mag-green-dark)]">Save</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
