import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Camera } from 'lucide-react'
import { getMyProfile, updateProfile } from '#/server/profiles'

export const Route = createFileRoute('/profile/edit')({ component: EditProfilePage })

function EditProfilePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: profile } = useQuery({ queryKey: ['my-profile'], queryFn: () => getMyProfile() })

  const [bio, setBio] = useState(profile?.bio || '')
  const [job, setJob] = useState(profile?.job || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [gender, setGender] = useState(profile?.gender || '')
  const [interests, setInterests] = useState((profile?.interests || []).join(', '))

  const handleSave = async () => {
    await updateProfile({
      data: {
        bio,
        job,
        location,
        gender,
        interests: interests.split(',').map((i) => i.trim()).filter(Boolean),
      },
    })
    qc.invalidateQueries({ queryKey: ['my-profile'] })
    navigate({ to: '/profile' })
  }

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-5 flex items-center gap-2">
        <button onClick={() => navigate({ to: '/profile' })} className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Edit Profile</h1>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto hide-scrollbar">
        {(profile?.photos || []).map((photo, i) => (
          <div key={i} className="relative min-w-[120px] flex-shrink-0 overflow-hidden rounded-2xl">
            <img src={photo} alt="" className="aspect-[3/4] w-full object-cover" />
            <button className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Job</label>
          <input type="text" value={job} onChange={(e) => setJob(e.target.value)} className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Location</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Gender</label>
          <div className="flex flex-wrap gap-2">
            {['Male', 'Female'].map((g) => (
              <button key={g} onClick={() => setGender(g)} className={`rounded-full px-4 py-2 text-xs font-medium ${g === gender ? 'bg-[var(--mag-green)] text-white' : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink)]'}`}>{g}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink)]">Interests (comma separated)</label>
          <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)} className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20" />
        </div>
      </div>

      <button onClick={handleSave} className="mt-6 inline-flex w-full max-w-xs items-center justify-center rounded-full bg-[var(--mag-green)] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[var(--mag-green-dark)]">Save Changes</button>
    </main>
  )
}
