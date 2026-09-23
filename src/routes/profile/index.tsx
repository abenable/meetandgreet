import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  BadgeCheck,
  Briefcase,
  Calendar,
  ChevronRight,
  Flame,
  Heart,
  MapPin,
  Pencil,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { getMyProfile } from '#/server/profiles'
import { getUserBadges, getUserStreak } from '#/server/badges'
import {
  Avatar,
  Badge,
  buttonClasses,
  Card,
  Skeleton,
} from '#/components/ui'

export const Route = createFileRoute('/profile/')({ component: ProfilePage })

const BADGE_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  first_match: { label: 'First match', icon: Heart },
  streak_3: { label: '3 day streak', icon: Flame },
  streak_7: { label: '7 day streak', icon: Flame },
  social_butterfly: { label: 'Social butterfly', icon: Users },
  event_host: { label: 'Event host', icon: Calendar },
  verified: { label: 'Verified', icon: BadgeCheck },
  ice_breaker: { label: 'Ice breaker', icon: Sparkles },
}

const INTENT_ICON: Record<string, React.ElementType> = {
  dating: Heart,
  friends: Users,
  networking: Briefcase,
}

function ProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => getMyProfile(),
  })
  const { data: badges } = useQuery({ queryKey: ['my-badges'], queryFn: () => getUserBadges() })
  const { data: streakData } = useQuery({ queryKey: ['my-streak'], queryFn: () => getUserStreak() })

  if (isLoading || !profile) {
    return (
      <main className="page-wrap py-5 pb-28">
        <div className="flex flex-col items-center">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="mt-4 h-6 w-36 rounded-full" />
          <Skeleton className="mt-2 h-4 w-24 rounded-full" />
        </div>
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-card" />
          ))}
        </div>
      </main>
    )
  }

  const photos = profile.photos ?? []
  const interests = profile.interests ?? []
  const intents = profile.lookingFor ?? []
  const verificationStatus = (profile as { verificationStatus?: string | null }).verificationStatus

  return (
    <main className="page-wrap py-5 pb-28">
      <div className="mb-6 flex justify-end">
        <Link
          to="/settings"
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-canvas-soft hover:text-ink"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex flex-col items-center text-center">
        <Avatar src={photos[0]} alt={profile.name ?? ''} size="xl" priority className="h-24 w-24" />
        <h1 className="mt-4 flex items-center gap-2 text-h2 text-ink">
          {profile.name || 'You'}
          {profile.verifiedAt && <BadgeCheck className="h-5 w-5 text-ink" />}
        </h1>
        {profile.location && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-body-sm text-ink-muted">
            <MapPin className="h-4 w-4" /> {profile.location}
          </p>
        )}
        {profile.job && <p className="mt-0.5 text-body-sm text-ink-muted">{profile.job}</p>}

        {(intents.length > 0 || (streakData?.streakCount ?? 0) > 1) && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {intents.map((intent) => {
              const Icon = INTENT_ICON[intent] ?? Heart
              return (
                <Badge key={intent}>
                  <Icon className="h-3 w-3" />
                  {intent.charAt(0).toUpperCase() + intent.slice(1)}
                </Badge>
              )
            })}
            {(streakData?.streakCount ?? 0) > 1 && (
              <Badge>
                <Flame className="h-3 w-3" />
                {streakData!.streakCount} day streak
              </Badge>
            )}
          </div>
        )}

        <Link to="/profile/edit" className={buttonClasses({ className: 'mt-5 px-6' })}>
          <Pencil className="h-4 w-4" /> Edit profile
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        <Link to="/profile/media" className="block no-underline">
          <Card className="transition hover:bg-canvas-soft">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-title text-ink">Photos</h2>
              <span className="flex items-center gap-1 text-body-sm text-ink-muted">
                {photos.length}/6 <ChevronRight className="h-4 w-4" />
              </span>
            </div>
            {photos.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {photos.map((photo, i) => (
                  <Avatar key={`${photo}-${i}`} src={photo} size="xl" square className="shrink-0" />
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-ink-muted">
                Add at least one photo — profiles without one are skipped in discovery.
              </p>
            )}
          </Card>
        </Link>

        <Card>
          <h2 className="text-title text-ink">About</h2>
          <p className="mt-1.5 text-body text-ink-muted">
            {profile.bio || 'Nothing here yet. Tell people what you are into.'}
          </p>
        </Card>

        {interests.length > 0 && (
          <Card>
            <h2 className="mb-3 text-title text-ink">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge key={interest}>{interest}</Badge>
              ))}
            </div>
          </Card>
        )}

        {badges && badges.length > 0 && (
          <Card>
            <h2 className="mb-3 text-title text-ink">Badges</h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => {
                const config = BADGE_CONFIG[badge.type]
                if (!config) return null
                const Icon = config.icon
                return (
                  <Badge key={badge.id} tone={badge.type === 'verified' ? 'ink' : 'neutral'}>
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                )
              })}
            </div>
          </Card>
        )}

        {!profile.verifiedAt && (
          <Link to="/verify" className="block no-underline">
            <Card className="flex items-center gap-3 transition hover:bg-canvas-soft">
              <BadgeCheck className="h-5 w-5 shrink-0 text-ink-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-title text-ink">
                  {verificationStatus === 'pending' ? 'Verification in review' : 'Get verified'}
                </p>
                <p className="text-body-sm text-ink-muted">
                  {verificationStatus === 'pending'
                    ? 'A moderator is looking at your photo.'
                    : verificationStatus === 'rejected'
                      ? 'Your last submission was rejected. Try another photo.'
                      : 'A verified badge tells people you are who you say you are.'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
            </Card>
          </Link>
        )}
      </div>
    </main>
  )
}
