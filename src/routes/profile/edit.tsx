import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Camera, ChevronRight, Pencil } from 'lucide-react'
import { myProfile } from '#/lib/mock-data'

export const Route = createFileRoute('/profile/edit')({ component: EditProfilePage })

function EditProfilePage() {
  const [bio, setBio] = useState(myProfile.bio)
  const [job, setJob] = useState('Product Designer at Tech Co')
  const [location, setLocation] = useState(myProfile.location)
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 800)
  }

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <a href="/profile" className="rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)] no-underline">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Edit Profile</h1>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        {myProfile.photos.map((photo, i) => (
          <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-xl">
            <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--mag-line)] bg-[var(--mag-surface)] text-[var(--mag-ink-muted)] transition hover:border-[var(--mag-green)]">
          <Camera className="h-5 w-5" />
          <span className="text-[10px] font-medium">Add</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink-soft)]">About Me</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] p-3 text-sm text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink-soft)]">Job Title</label>
          <input
            type="text"
            value={job}
            onChange={(e) => setJob(e.target.value)}
            className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 px-4 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink-soft)]">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 px-4 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink-soft)]">Gender</label>
          <div className="flex gap-2">
            {['Woman', 'Man', 'Non-binary'].map((g) => (
              <button
                key={g}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  g === myProfile.gender
                    ? 'bg-[var(--mag-green)] text-white'
                    : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink)]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink-soft)]">Interests</label>
          <div className="flex flex-wrap gap-2">
            {myProfile.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-[var(--mag-green)]/10 px-3 py-1.5 text-xs font-medium text-[var(--mag-green)]"
              >
                {interest}
              </span>
            ))}
            <button className="rounded-full border border-dashed border-[var(--mag-line)] px-3 py-1.5 text-xs font-medium text-[var(--mag-ink-muted)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-green)]">
              + Add
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 w-full rounded-full bg-[var(--mag-green)] py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--mag-green-dark)] disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </main>
  )
}
