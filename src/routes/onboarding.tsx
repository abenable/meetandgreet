import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@heroui/react'
import { Camera, ChevronRight, User, Sparkles, MapPin, X, AlignLeft } from 'lucide-react'
import { getMyProfile, updateProfile } from '#/server/profiles'
import { uploadImageToR2, maybeDeleteR2Image } from '#/lib/upload'
import { nextOnboardingStep } from '#/lib/profile-complete'
import { GENDER_OPTIONS } from '#/lib/gender'
import AvatarImage from '#/components/AvatarImage'

export const Route = createFileRoute('/onboarding')({ component: OnboardingPage })

const STEP_TITLES = ['Photos', 'About you', 'Location', 'Bio']
/** Matches the server-side bio cap in updateProfile. */
const MAX_BIO = 500

function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: profile, isLoading } = useQuery({ queryKey: ['my-profile'], queryFn: () => getMyProfile() })

  const [started, setStarted] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [photos, setPhotos] = useState<string[]>([])
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [error, setError] = useState('')

  // Seed the form from the saved profile exactly once — refetches must not
  // clobber whatever the user has typed since.
  useEffect(() => {
    if (!profile || started) return
    setStarted(true)
    setPhotos(profile.photos ?? [])
    setName(profile.name ?? '')
    setGender(profile.gender ?? '')
    setLocation(profile.location ?? '')
    setBio(profile.bio ?? '')
    setStep(nextOnboardingStep(profile))
  }, [profile, started])

  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      setError('')
    },
    onError: (err) => setError((err as Error)?.message || 'Could not save. Try again.'),
  })

  const totalSteps = 4

  const goTo = (next: 1 | 2 | 3 | 4) => {
    setError('')
    setStep(next)
  }

  // --- Photos -------------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null)
  const slotRef = useRef<number | null>(null)

  const openPicker = (slot: number) => {
    if (photos.length >= 6 && slot >= photos.length) return
    slotRef.current = slot
    fileInputRef.current?.click()
  }

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    const slot = slotRef.current
    if (!file || slot === null || !profile) return
    setUploadingIndex(slot)
    setError('')
    try {
      const key = `profiles/${profile.userId}/photo-${crypto.randomUUID()}.jpg`
      const url = await uploadImageToR2(file, key)
      const next = [...photos]
      if (slot < next.length) {
        const old = next[slot]
        next[slot] = url
        if (old) void maybeDeleteR2Image(old)
      } else {
        next.push(url)
      }
      setPhotos(next)
      try {
        await save.mutateAsync({ data: { photos: next } })
      } catch (err) {
        // Roll the tile back so the UI matches what the server actually has.
        setPhotos(photos)
        void maybeDeleteR2Image(url)
        throw err
      }
    } catch (err) {
      setError((err as Error)?.message || 'Upload failed. Try again.')
    } finally {
      setUploadingIndex(null)
      slotRef.current = null
    }
  }

  const removePhoto = async (index: number) => {
    const removed = photos[index]
    const previous = photos
    const next = photos.filter((_, i) => i !== index)
    setPhotos(next)
    try {
      await save.mutateAsync({ data: { photos: next } })
    } catch (err) {
      setPhotos(previous)
      setError((err as Error)?.message || 'Could not remove that photo. Try again.')
      return
    }
    if (removed) void maybeDeleteR2Image(removed)
  }

  // --- Step completion ----------------------------------------------------
  // Photos are optional — you can skip straight through this step.
  const step1Done = uploadingIndex === null
  const step2Done = !!name.trim()
  const step3Done = !!location.trim()
  const step4Done = !!bio.trim()
  const stepDone = [step1Done, step2Done, step3Done, step4Done][step - 1]

  const handleContinue = async () => {
    if (!stepDone) return
    try {
      if (step === 1) {
        // photos are already saved as they are added
      } else if (step === 2) {
        await save.mutateAsync({ data: { name: name.trim(), gender } })
      } else if (step === 3) {
        await save.mutateAsync({ data: { location: location.trim() } })
      } else {
        await save.mutateAsync({ data: { bio: bio.trim() } })
        // Gate re-reads this cache — make sure it sees the finished profile
        // before navigating.
        await queryClient.invalidateQueries({ queryKey: ['my-profile'] })
        navigate({ to: '/discover' })
        return
      }
      goTo((step + 1) as 1 | 2 | 3 | 4)
    } catch {
      // save.onError already surfaced the message
    }
  }

  if (isLoading || !started) {
    return (
      <div className="page-wrap flex min-h-[90vh] flex-col items-center justify-center px-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="mt-4 h-4 w-64 rounded-lg" />
        <Skeleton className="mt-8 h-40 w-full max-w-sm rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="page-wrap flex min-h-[100dvh] flex-col px-4 py-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--mag-ink-muted)]">
            Step {step} of {totalSteps} · {STEP_TITLES[step - 1]}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i + 1 <= step ? 'w-6 bg-[var(--mag-ink)]' : 'w-1.5 bg-[var(--mag-line)]'
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="rise-in flex flex-1 flex-col">
            <h1 className="mb-2 text-2xl font-bold text-[var(--mag-ink)]">Add a photo</h1>
            <p className="mb-6 text-base text-[var(--mag-ink-soft)]">
              Optional, but profiles with photos get far more matches. Your first photo is your avatar — or just hit Next to skip.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => {
                const url = photos[i]
                if (url) {
                  return (
                    <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-[var(--mag-surface)]">
                      <AvatarImage src={url} alt={`Photo ${i + 1}`} />
                      {i === 0 && (
                        <span className="absolute left-1 top-1 rounded-full bg-[var(--mag-ink)]/90 px-1.5 py-0.5 text-xs font-bold text-[var(--on-ink)]">
                          AVATAR
                        </span>
                      )}
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                        title="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                }
                return (
                  <button
                    key={i}
                    onClick={() => openPicker(i)}
                    disabled={uploadingIndex !== null}
                    className="flex aspect-[3/4] items-center justify-center rounded-xl border-2 border-dashed border-[var(--mag-line)] bg-[var(--mag-surface)] transition hover:border-[var(--mag-ink)] disabled:opacity-50"
                  >
                    {uploadingIndex === i ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--mag-ink)] border-t-transparent" />
                    ) : (
                      <Camera className="h-6 w-6 text-[var(--mag-ink-muted)]" />
                    )}
                  </button>
                )
              })}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
          </div>
        )}

        {step === 2 && (
          <div className="rise-in flex flex-1 flex-col">
            <h1 className="mb-2 text-2xl font-bold text-[var(--mag-ink)]">About you</h1>
            <p className="mb-6 text-base text-[var(--mag-ink-soft)]">
              Tell us a little about yourself.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--mag-ink-soft)]">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mag-ink-muted)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-full bg-[var(--input-bg)] py-3 pl-10 pr-4 text-base text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:outline-none focus:bg-[var(--mag-card)] focus:shadow-md"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--mag-ink-soft)]">Gender</label>
                <div className="flex flex-wrap gap-2">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(gender === g ? '' : g)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        gender === g
                          ? 'bg-[var(--mag-ink)] text-[var(--on-ink)]'
                          : 'bg-[var(--mag-card)] shadow-sm text-[var(--mag-ink)] hover:bg-[var(--mag-surface)]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rise-in flex flex-1 flex-col">
            <h1 className="mb-2 text-2xl font-bold text-[var(--mag-ink)]">Where are you?</h1>
            <p className="mb-6 text-base text-[var(--mag-ink-soft)]">
              Shown on your profile so people nearby can find you.
            </p>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mag-ink-muted)]" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                className="w-full rounded-full bg-[var(--input-bg)] py-3 pl-10 pr-4 text-base text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:outline-none focus:bg-[var(--mag-card)] focus:shadow-md"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="rise-in flex flex-1 flex-col">
            <h1 className="mb-2 text-2xl font-bold text-[var(--mag-ink)]">Your bio</h1>
            <p className="mb-6 text-base text-[var(--mag-ink-soft)]">
              A quick intro — what you're about and what you're looking for.
            </p>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-4 h-4 w-4 text-[var(--mag-ink-muted)]" />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
                placeholder="Hi! I'm into..."
                rows={6}
                className="w-full resize-none rounded-card bg-[var(--input-bg)] py-3 pl-10 pr-4 text-base text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:outline-none focus:bg-[var(--mag-card)] focus:shadow-md"
              />
            </div>
            <p className={`mt-1.5 text-right text-sm ${bio.trim().length === MAX_BIO ? 'text-red-600 dark:text-red-400' : 'text-[var(--mag-ink-muted)]'}`}>
              {bio.length}/{MAX_BIO}
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          {step > 1 && (
            <button
              onClick={() => goTo((step - 1) as 1 | 2 | 3 | 4)}
              className="rounded-full bg-[var(--mag-ink)] shadow-sm px-8 py-3 text-base font-semibold text-[var(--on-ink)] transition hover:opacity-90"
            >
              Back
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!stepDone || save.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--mag-ink)] px-8 py-3 text-base font-semibold text-[var(--on-ink)] transition hover:opacity-80 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
          >
            {step < totalSteps ? (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Start Swiping
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
