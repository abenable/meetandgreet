import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Camera, Link2, Pencil, Trash2, AlertTriangle, Sparkles, ShieldCheck, Heart, Users, Briefcase } from 'lucide-react'
import { getMyProfile, updateProfile, verifyPhoto } from '#/server/profiles'
import { disableMyAccount } from '#/server/auth'
import AvatarImage from '#/components/AvatarImage'
import { VerifiedBadge } from '#/components/VerifiedBadge'
import { uploadImageToR2, maybeDeleteR2Image } from '#/lib/upload'

export const Route = createFileRoute('/profile/')({ component: ProfilePage })

function formatNameWithGender(name: string | null, gender: string | null): string {
  const initial = gender === 'Male' ? 'M' : gender === 'Female' ? 'F' : ''
  return initial ? `${name || ''}, ${initial}` : (name || '')
}

function ProfilePage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const { data: profile } = useQuery({ queryKey: ['my-profile'], queryFn: () => getMyProfile() })

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editGender, setEditGender] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyStep, setVerifyStep] = useState(1)
  const [verifyPose, setVerifyPose] = useState('')
  const [verifyPreview, setVerifyPreview] = useState('')
  const [verifyUploading, setVerifyUploading] = useState(false)
  const verifyFileRef = useRef<HTMLInputElement>(null)

  const poses = [
    'Hold up 2 fingers ✌️',
    'Thumbs up 👍',
    'Wink with one eye 😉',
    'Hand on your chin 🤔',
    'Peace sign over your eye ✌️😉',
  ]

  const startVerification = () => {
    setVerifyStep(1)
    setVerifyPreview('')
    setVerifyPose(poses[Math.floor(Math.random() * poses.length)])
    setShowVerifyModal(true)
  }

  const handleVerifyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setVerifyPreview(ev.target?.result as string)
      setVerifyStep(3)
    }
    reader.readAsDataURL(file)
  }

  const submitVerification = async () => {
    if (!verifyPreview) return
    setVerifyUploading(true)
    try {
      await verifyPhoto({ data: { imageBase64: verifyPreview } })
      setVerifyStep(4)
      qc.invalidateQueries({ queryKey: ['my-profile'] })
    } catch {
      // silently fail
    } finally {
      setVerifyUploading(false)
    }
  }

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

  const disableMutation = useMutation({
    mutationFn: async () => {
      await disableMyAccount()
    },
    onSuccess: () => {
      window.location.href = '/'
    },
  })

  const openEdit = (field: string, current: string, gender?: string) => {
    setEditingField(field)
    setEditValue(current)
    if (gender) setEditGender(gender)
  }

  const saveEdit = () => {
    if (!editingField || !profile) return
    const updates: any = {}
    if (editingField === 'name') {
      updates.name = editValue
      updates.gender = editGender
    }
    if (editingField === 'bio') updates.bio = editValue
    if (editingField === 'location') updates.location = editValue
    updateMutation.mutate(updates)
  }

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploadingAvatar(true)
    try {
      const key = `profiles/${profile.userId}/avatar-${crypto.randomUUID()}.jpg`
      const url = await uploadImageToR2(file, key, 600)

      const oldAvatar = (profile.photos || [])[0]
      if (oldAvatar?.startsWith('http')) {
        await maybeDeleteR2Image(oldAvatar).catch(() => {})
      }

      const photos = [url, ...(profile.photos || []).slice(1)]
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
      <div className="page-wrap flex flex-1 flex-col items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--mag-green)] border-t-transparent" />
      </div>
    )
  }

  const avatarPhoto = (profile.photos || [])[0]

  return (
    <div className="page-wrap flex flex-1 flex-col px-4 py-4">
      {/* Profile Avatar */}
      <div className="mb-4 flex flex-col items-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-[var(--mag-card)] shadow-md">
          <AvatarImage src={avatarPhoto} alt="Profile" />
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
        <div className="mt-3 flex items-center gap-2">
          <h2 className="text-xl font-bold text-[var(--mag-ink)]">{formatNameWithGender(profile.name, profile.gender) || 'You'}</h2>
          {profile.verifiedAt && <VerifiedBadge />}
          <button
            onClick={() => openEdit('name', profile.name || '', profile.gender || '')}
            className="rounded-full p-1 text-[var(--mag-ink-muted)] transition hover:bg-[var(--mag-surface)] hover:text-[var(--mag-ink)]"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-0.5 inline-flex items-center gap-1 text-sm text-[var(--mag-ink-soft)]">
          <MapPin className="h-3.5 w-3.5" />
          <span>{profile.location || 'Add your college'}</span>
        </div>
        {profile.lookingFor && profile.lookingFor.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {profile.lookingFor.map((intent) => (
              <span
                key={intent}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  intent === 'dating'
                    ? 'bg-pink-100 text-pink-700'
                    : intent === 'friends'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                }`}
              >
                {intent === 'dating' && <Heart className="h-3 w-3" />}
                {intent === 'friends' && <Users className="h-3 w-3" />}
                {intent === 'networking' && <Briefcase className="h-3 w-3" />}
                {intent.charAt(0).toUpperCase() + intent.slice(1)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {(profile.interests || []).map((interest: string) => (
          <span key={interest} className="rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-3 py-1.5 text-xs font-medium text-[var(--mag-ink)]">{interest}</span>
        ))}
      </div>

      <div onClick={() => openEdit('bio', profile.bio || '')} className="mb-4 cursor-pointer rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 card-shadow transition hover:border-[var(--mag-green)]/30">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--mag-ink)]">About Me</h3>
          <Pencil className="h-3 w-3 text-[var(--mag-ink-muted)]" />
        </div>
        <p className="text-sm leading-relaxed text-[var(--mag-ink-soft)]">{profile.bio || 'Add a bio'}</p>
      </div>

      <div onClick={() => navigate({ to: '/profile/media' })} className="mb-4 cursor-pointer rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 card-shadow transition hover:border-[var(--mag-green)]/30">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--mag-ink)]">My Photos</h3>
          <span className="text-xs text-[var(--mag-ink-muted)]">{(profile.photos || []).length} photos</span>
        </div>
        <div className="flex items-center gap-2">
          {(profile.photos || []).slice(0, 4).map((photo: string, i: number) => (
            <div key={i} className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
              <img src={photo} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            </div>
          ))}
          {(profile.photos || []).length === 0 && (
            <span className="text-sm text-[var(--mag-ink-muted)]">Tap to add photos</span>
          )}
        </div>
        {(profile.photos || []).length < 3 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--mag-green)]/10 px-3 py-2">
            <Sparkles className="h-4 w-4 flex-shrink-0 text-[var(--mag-green)]" />
            <p className="text-xs font-medium text-[var(--mag-green)]">
              Profiles with 3+ photos get 10x more matches. Tap to add more.
            </p>
          </div>
        )}
      </div>

      <div onClick={() => openEdit('location', profile.location || '')} className="mb-4 cursor-pointer rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4 card-shadow transition hover:border-[var(--mag-green)]/30">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--mag-ink)]">Location</h3>
          <Pencil className="h-3 w-3 text-[var(--mag-ink-muted)]" />
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--mag-ink-soft)]">
          <MapPin className="h-4 w-4 text-[var(--mag-ink-muted)]" /><span>{profile.location || 'Add your college'}</span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
        <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-6 py-2.5 text-sm font-semibold text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)] card-shadow">
          <Link2 className="h-4 w-4" />Share Profile
        </button>
        {!profile.verifiedAt && (
          <button
            onClick={startVerification}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-6 py-2.5 text-sm font-semibold text-blue-500 transition hover:bg-blue-500/20"
          >
            <ShieldCheck className="h-4 w-4" />Verify Photo
          </button>
        )}
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/20 disabled:opacity-60"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Log Out
        </button>
      </div>

      <div className="mb-6 mt-2 border-t border-[var(--mag-line)] pt-4">
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4" />
          Delete Account
        </button>
        <p className="mt-2 text-center text-[10px] text-[var(--mag-ink-muted)]">
          Your account will be disabled and you will no longer appear anywhere in the app.
        </p>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 shadow-xl">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="text-sm font-semibold text-[var(--mag-ink)]">Delete Account</h3>
            </div>
            <p className="mb-4 text-sm text-[var(--mag-ink-soft)]">
              Are you sure? This will disable your account, remove you from all events, and you will no longer be visible to anyone. Your email will be permanently blocked from re-registration.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
              >
                Cancel
              </button>
              <button
                onClick={() => disableMutation.mutate()}
                disabled={disableMutation.isPending}
                className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {disableMutation.isPending ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold text-[var(--mag-ink)]">
              {editingField === 'name' ? 'Edit Profile' : editingField === 'bio' ? 'About Me' : 'Location'}
            </h3>
            {editingField === 'name' && (
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink-soft)]">Display Name</label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
                />
              </div>
            )}
            {editingField !== 'name' && (
              <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={editingField === 'bio' ? 4 : 1}
                className="mb-4 w-full resize-none rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] p-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20" />
            )}
            {editingField === 'name' && (
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink-soft)]">Gender</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setEditingField(null)} className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]">Cancel</button>
              <button onClick={saveEdit} disabled={updateMutation.isPending} className="flex-1 rounded-full bg-[var(--mag-green)] py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--mag-green-dark)] disabled:opacity-60">{updateMutation.isPending ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 px-4 pb-20 sm:items-center sm:pb-0">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 shadow-xl">
            {verifyStep === 1 && (
              <>
                <h3 className="mb-1 text-base font-bold text-[var(--mag-ink)]">Photo Verification</h3>
                <p className="mb-4 text-xs text-[var(--mag-ink-soft)]">
                  Take a real-time selfie to get a verified badge on your profile.
                </p>
                <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-center">
                  <p className="text-sm font-semibold text-blue-500">Your pose:</p>
                  <p className="mt-1 text-lg text-[var(--mag-ink)]">{verifyPose}</p>
                </div>
                <button
                  onClick={() => setVerifyStep(2)}
                  className="w-full rounded-full bg-[var(--mag-green)] py-3 text-sm font-bold text-white transition hover:bg-[var(--mag-green-dark)]"
                >
                  I'm Ready
                </button>
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="mt-2 w-full rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
                >
                  Cancel
                </button>
              </>
            )}
            {verifyStep === 2 && (
              <>
                <h3 className="mb-1 text-base font-bold text-[var(--mag-ink)]">Capture Selfie</h3>
                <p className="mb-4 text-xs text-[var(--mag-ink-soft)]">
                  Show your face clearly and {verifyPose.toLowerCase()}.
                </p>
                <button
                  onClick={() => verifyFileRef.current?.click()}
                  className="mb-3 flex w-full items-center justify-center rounded-xl border-2 border-dashed border-[var(--mag-line)] bg-[var(--mag-surface)] py-8 text-sm font-medium text-[var(--mag-ink-soft)] transition hover:border-[var(--mag-green)] hover:text-[var(--mag-ink)]"
                >
                  <Camera className="mr-2 h-5 w-5" /> Take Selfie
                </button>
                <input
                  ref={verifyFileRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleVerifyFile}
                />
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="w-full rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
                >
                  Cancel
                </button>
              </>
            )}
            {verifyStep === 3 && (
              <>
                <h3 className="mb-1 text-base font-bold text-[var(--mag-ink)]">Review</h3>
                <p className="mb-4 text-xs text-[var(--mag-ink-soft)]">
                  Make sure your face and pose are clearly visible.
                </p>
                <div className="mb-4 overflow-hidden rounded-xl">
                  <img src={verifyPreview} alt="Preview" className="w-full object-cover" />
                </div>
                <button
                  onClick={submitVerification}
                  disabled={verifyUploading}
                  className="w-full rounded-full bg-[var(--mag-green)] py-3 text-sm font-bold text-white transition hover:bg-[var(--mag-green-dark)] disabled:opacity-60"
                >
                  {verifyUploading ? 'Uploading…' : 'Submit for Verification'}
                </button>
                <button
                  onClick={() => setVerifyStep(2)}
                  disabled={verifyUploading}
                  className="mt-2 w-full rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)] disabled:opacity-60"
                >
                  Retake
                </button>
              </>
            )}
            {verifyStep === 4 && (
              <>
                <div className="flex flex-col items-center py-4">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-white">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--mag-ink)]">You're Verified!</h3>
                  <p className="mt-1 text-center text-xs text-[var(--mag-ink-soft)]">
                    Your profile now shows a blue checkmark badge.
                  </p>
                </div>
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="w-full rounded-full bg-[var(--mag-green)] py-3 text-sm font-bold text-white transition hover:bg-[var(--mag-green-dark)]"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
