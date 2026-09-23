import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Briefcase, Check, ChevronDown, Heart, ImagePlus, Users, X } from 'lucide-react'
import { getMyProfile, updateProfile } from '#/server/profiles'
import { PageHeader } from '#/components/PageHeader'
import {
  Avatar,
  Button,
  buttonClasses,
  Field,
  Input,
  Select,
  Sheet,
  Skeleton,
  Textarea,
  useToast,
} from '#/components/ui'
import { cn } from '#/lib/cn'
import { GENDER_OPTIONS } from '#/lib/gender'

export const Route = createFileRoute('/profile/edit')({ component: EditProfilePage })

const MAX_BIO = 500
const MAX_INTERESTS = 20

const INTENTS = [
  { value: 'dating' as const, label: 'Dating', icon: Heart },
  { value: 'friends' as const, label: 'Friends', icon: Users },
  { value: 'networking' as const, label: 'Networking', icon: Briefcase },
]

type Intent = (typeof INTENTS)[number]['value']

function EditProfilePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => getMyProfile(),
  })

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [job, setJob] = useState('')
  const [location, setLocation] = useState('')
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [interestDraft, setInterestDraft] = useState('')
  const [lookingFor, setLookingFor] = useState<Intent[]>([])
  const [intentSheetOpen, setIntentSheetOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!profile || hydrated) return
    setName(profile.name ?? '')
    setBio(profile.bio ?? '')
    setJob(profile.job ?? '')
    setLocation(profile.location ?? '')
    setGender(profile.gender ?? '')
    setBirthDate(profile.birthDate ?? '')
    setInterests(profile.interests ?? [])
    setLookingFor((profile.lookingFor ?? []) as Intent[])
    setHydrated(true)
  }, [profile, hydrated])

  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      qc.invalidateQueries({ queryKey: ['swipe-deck'] })
      toast('Profile saved', { tone: 'success' })
      navigate({ to: '/profile' })
    },
    onError: (e: Error) => toast(e.message || 'Could not save your profile.', { tone: 'error' }),
  })

  const addInterest = () => {
    const value = interestDraft.trim().replace(/,$/, '')
    if (!value || interests.length >= MAX_INTERESTS) return
    if (interests.some((i) => i.toLowerCase() === value.toLowerCase())) {
      setInterestDraft('')
      return
    }
    setInterests((prev) => [...prev, value.slice(0, 50)])
    setInterestDraft('')
  }

  const toggleIntent = (value: Intent) =>
    setLookingFor((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )

  if (isLoading || !hydrated) {
    return (
      <main className="page-wrap py-5 pb-28">
        <PageHeader title="Edit profile" back="/profile" />
        <div className="space-y-5">
          <Skeleton className="h-28 w-full rounded-card" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-card" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="page-wrap py-5 pb-28">
      <PageHeader title="Edit profile" back="/profile" />

      <section className="mb-7">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-label text-ink-faint">Photos</h2>
          <span className="text-body-sm text-ink-faint">{(profile?.photos ?? []).length}/6</span>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {(profile?.photos ?? []).map((photo, i) => (
            <Avatar key={`${photo}-${i}`} src={photo} size="xl" square className="shrink-0" />
          ))}
          <Link
            to="/profile/media"
            aria-label="Manage photos"
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-media border border-dashed border-hairline text-ink-faint no-underline transition hover:border-ink hover:text-ink"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-caption">Manage</span>
          </Link>
        </div>
      </section>

      <div className="space-y-5">
        <Field label="Name">
          {({ id }) => (
            <Input
              id={id}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={100}
              placeholder="Your name"
            />
          )}
        </Field>

        <Field label="Bio" aside={`${bio.length}/${MAX_BIO}`}>
          {({ id }) => (
            <Textarea
              id={id}
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
              rows={4}
              placeholder="What are you into? What are you looking for?"
            />
          )}
        </Field>

        <Field label="Birthday" hint="Used for age filtering. Never shown as a date.">
          {({ id, describedBy }) => (
            <Input
              id={id}
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              aria-describedby={describedBy}
              max={new Date().toISOString().slice(0, 10)}
            />
          )}
        </Field>

        <Field label="Gender">
          {({ id }) => (
            <Select
              id={id}
              value={gender}
              placeholder="Select your gender"
              onChange={(e) => setGender(e.target.value)}
            >
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="I'm looking for" hint="Pick as many as apply.">
          {({ id, describedBy }) => (
            <button
              id={id}
              type="button"
              aria-describedby={describedBy}
              aria-haspopup="dialog"
              onClick={() => setIntentSheetOpen(true)}
              className="flex h-11 w-full items-center gap-2 rounded-full bg-field px-4 text-left transition-[background-color,box-shadow] duration-200 hover:bg-canvas-soft"
            >
              <span className={cn('min-w-0 flex-1 truncate text-body', lookingFor.length ? 'text-ink' : 'text-ink-faint')}>
                {lookingFor.length
                  ? INTENTS.filter((i) => lookingFor.includes(i.value)).map((i) => i.label).join(', ')
                  : 'Select what you are here for'}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-ink-faint" />
            </button>
          )}
        </Field>

        <Field label="Location">
          {({ id }) => (
            <Input
              id={id}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
              placeholder="City"
            />
          )}
        </Field>

        <Field label="Work">
          {({ id }) => (
            <Input
              id={id}
              value={job}
              onChange={(e) => setJob(e.target.value)}
              maxLength={200}
              placeholder="What you do"
            />
          )}
        </Field>

        <Field
          label="Interests"
          hint={`Press Enter to add. ${interests.length}/${MAX_INTERESTS}`}
        >
          {({ id, describedBy }) => (
            <>
              {interests.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1.5 rounded-full bg-canvas-soft py-1.5 pr-1.5 pl-3 text-body-sm text-ink"
                    >
                      {interest}
                      <button
                        type="button"
                        aria-label={`Remove ${interest}`}
                        onClick={() => setInterests((prev) => prev.filter((i) => i !== interest))}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-ink-faint transition hover:bg-hairline hover:text-ink"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <Input
                id={id}
                value={interestDraft}
                aria-describedby={describedBy}
                disabled={interests.length >= MAX_INTERESTS}
                onChange={(e) => setInterestDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addInterest()
                  }
                  if (e.key === 'Backspace' && !interestDraft && interests.length > 0) {
                    setInterests((prev) => prev.slice(0, -1))
                  }
                }}
                onBlur={addInterest}
                placeholder={interests.length >= MAX_INTERESTS ? 'Maximum reached' : 'Add an interest'}
              />
            </>
          )}
        </Field>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <Button
          block
          size="lg"
          loading={save.isPending}
          onClick={() =>
            save.mutate({
              data: {
                name,
                bio,
                job,
                location,
                gender,
                birthDate,
                interests,
                lookingFor,
              },
            })
          }
        >
          Save changes
        </Button>
        <Link to="/profile" className={buttonClasses({ variant: 'ghost', size: 'lg', block: true })}>
          Cancel
        </Link>
      </div>

      <Sheet
        open={intentSheetOpen}
        onClose={() => setIntentSheetOpen(false)}
        title="I'm looking for"
        description="Pick as many as apply. This shows on your profile."
        footer={
          <Button block onClick={() => setIntentSheetOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="flex flex-col">
          {INTENTS.map(({ value, label, icon: Icon }) => {
            const selected = lookingFor.includes(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleIntent(value)}
                aria-pressed={selected}
                className="flex items-center gap-3 rounded-media px-2 py-3 text-left transition hover:bg-canvas-soft"
              >
                <Icon className="h-5 w-5 shrink-0 text-ink-muted" />
                <span className="flex-1 text-body text-ink">{label}</span>
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition',
                    selected ? 'bg-ink text-on-ink' : 'bg-canvas-soft text-transparent',
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            )
          })}
        </div>
      </Sheet>
    </main>
  )
}
