import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Check, Globe } from 'lucide-react'
import { getMyProfile, updateProfile } from '#/server/profiles'
import { getMyActiveEvent } from '#/server/events'
import { PageHeader } from '#/components/PageHeader'
import { buttonClasses, Card, SegmentedControl, Skeleton, useToast } from '#/components/ui'
import { cn } from '#/lib/cn'

export const Route = createFileRoute('/settings/discovery')({ component: DiscoverySettingsPage })

const SHOW_ME_OPTIONS = ['Women', 'Men', 'Everyone'] as const

function DiscoverySettingsPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [ageMin, setAgeMin] = useState(18)
  const [ageMax, setAgeMax] = useState(99)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => getMyProfile(),
  })
  const { data: activeEvent } = useQuery({
    queryKey: ['active-event'],
    queryFn: () => getMyActiveEvent(),
  })

  useEffect(() => {
    if (!profile) return
    setAgeMin(profile.prefAgeMin)
    setAgeMax(profile.prefAgeMax)
  }, [profile])

  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      qc.invalidateQueries({ queryKey: ['swipe-deck'] })
    },
    onError: () => toast('Could not save that. Try again.', { tone: 'error' }),
  })

  const discoveryMode = profile?.discoveryMode ?? 'global'
  const showMe = profile?.prefShowMe ?? 'Everyone'

  const commitAges = (min: number, max: number) =>
    save.mutate({ data: { prefAgeMin: min, prefAgeMax: max } })

  return (
    <main className="page-wrap py-5 pb-nav">
      <PageHeader title="Discovery" back="/settings" />

      <section className="mb-7">
        <h2 className="mb-2 text-label text-ink-faint">Who can find you</h2>
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-card" />
        ) : (
          <div className="space-y-2">
            <ModeOption
              icon={<Globe />}
              title="Everyone"
              description="You appear in the global pool. No event check-in needed."
              selected={discoveryMode === 'global'}
              disabled={save.isPending}
              onSelect={() => save.mutate({ data: { discoveryMode: 'global' } })}
            />
            <ModeOption
              icon={<Calendar />}
              title="Only at events"
              description={
                activeEvent
                  ? `Only attendees of ${activeEvent.name} can find you. You leave the global pool.`
                  : 'Only attendees of an event you have checked into can find you. You leave the global pool.'
              }
              selected={discoveryMode === 'event'}
              disabled={save.isPending}
              onSelect={() => save.mutate({ data: { discoveryMode: 'event' } })}
            />
            {discoveryMode === 'event' && !activeEvent && (
              <Card variant="soft" className="flex items-center justify-between gap-3">
                <p className="text-body-sm text-ink-muted">
                  You are not checked into an event, so nobody can find you right now.
                </p>
                <Link to="/events" className={buttonClasses({ size: 'sm', className: 'shrink-0' })}>
                  Browse
                </Link>
              </Card>
            )}
          </div>
        )}
      </section>

      <section className="mb-7">
        <h2 className="mb-2 text-label text-ink-faint">Show me</h2>
        <SegmentedControl
          aria-label="Who to show in discovery"
          value={showMe as (typeof SHOW_ME_OPTIONS)[number]}
          onChange={(option) => save.mutate({ data: { prefShowMe: option } })}
          segments={SHOW_ME_OPTIONS.map((option) => ({ value: option, label: option }))}
        />
      </section>

      <section>
        <h2 className="mb-2 text-label text-ink-faint">Age range</h2>
        <Card>
          <AgeSlider
            label="Youngest"
            value={ageMin}
            min={18}
            max={ageMax}
            onChange={setAgeMin}
            onCommit={() => commitAges(ageMin, ageMax)}
          />
          <AgeSlider
            label="Oldest"
            value={ageMax}
            min={ageMin}
            max={99}
            onChange={setAgeMax}
            onCommit={() => commitAges(ageMin, ageMax)}
            className="mt-5"
          />
          <p className="mt-4 text-body-sm text-ink-faint">
            Showing people aged {ageMin} to {ageMax}. Profiles without a birthday are always
            shown.
          </p>
        </Card>
        {save.isSuccess && !save.isPending && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-body-sm text-success">
            <Check className="h-4 w-4" /> Saved
          </p>
        )}
      </section>
    </main>
  )
}

function ModeOption({
  icon,
  title,
  description,
  selected,
  disabled,
  onSelect,
}: {
  icon: React.ReactNode
  title: string
  description: string
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-start gap-3 rounded-card p-4 text-left transition disabled:opacity-60',
        selected
          ? 'bg-ink text-on-ink shadow-md'
          : 'bg-canvas-raised shadow-sm hover:bg-canvas-soft hover:shadow-md',
      )}
    >
      <span className={cn('mt-0.5 shrink-0 [&>svg]:h-5 [&>svg]:w-5', selected ? 'text-on-ink' : 'text-ink-muted')}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-title">{title}</span>
        <span className={cn('mt-0.5 block text-body-sm', selected ? 'opacity-80' : 'text-ink-muted')}>
          {description}
        </span>
      </span>
      {selected && <Check className="mt-0.5 h-5 w-5 shrink-0" />}
    </button>
  )
}

function AgeSlider({
  label,
  value,
  min,
  max,
  onChange,
  onCommit,
  className,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (next: number) => void
  onCommit: () => void
  className?: string
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-body-sm font-semibold text-ink-soft">{label}</label>
        <span className="text-body text-ink tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        aria-label={`${label} age`}
        className="w-full accent-ink"
      />
    </div>
  )
}
