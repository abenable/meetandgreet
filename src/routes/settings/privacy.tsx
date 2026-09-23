import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, ChevronRight, EyeOff, Shield, UserRoundX } from 'lucide-react'
import { getMyProfile, updateProfile } from '#/server/profiles'
import { PageHeader } from '#/components/PageHeader'
import { Card, Skeleton, Switch, useToast } from '#/components/ui'

export const Route = createFileRoute('/settings/privacy')({ component: PrivacySettingsPage })

function PrivacySettingsPage() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => getMyProfile(),
  })

  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      qc.invalidateQueries({ queryKey: ['swipe-deck'] })
      qc.invalidateQueries({ queryKey: ['friends'] })
    },
    onError: () => toast('Could not save that. Try again.', { tone: 'error' }),
  })

  const showOnlineStatus = profile?.showOnlineStatus ?? true
  const hidden = profile?.hidden ?? false

  return (
    <main className="page-wrap py-5 pb-28">
      <PageHeader title="Privacy" back="/settings" />

      <section className="mb-7">
        <h2 className="mb-2 text-label text-ink-faint">Visibility</h2>
        {isLoading ? (
          <Skeleton className="h-36 w-full rounded-card" />
        ) : (
          <Card padding="none" className="px-4">
            <Switch
              leading={<EyeOff />}
              label="Show when you're active"
              description="Others see an 'Active now' dot on your profile and in their friends list."
              checked={showOnlineStatus}
              disabled={save.isPending}
              onChange={(next) => save.mutate({ data: { showOnlineStatus: next } })}
            />
            <Switch
              leading={<UserRoundX />}
              label="Pause my profile"
              description="You stop appearing in discovery and search. Your chats and friends stay."
              checked={hidden}
              disabled={save.isPending}
              onChange={(next) => save.mutate({ data: { hidden: next } })}
            />
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-label text-ink-faint">Safety</h2>
        <Card padding="none">
          <Link
            to="/safety"
            className="flex items-center gap-3 border-b border-hairline-soft px-4 py-3.5 no-underline transition hover:bg-canvas-soft"
          >
            <Shield className="h-5 w-5 shrink-0 text-ink-muted" />
            <span className="flex-1 text-body text-ink">Safety Centre</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
          </Link>
          <Link
            to="/settings/blocked"
            className="flex items-center gap-3 px-4 py-3.5 no-underline transition hover:bg-canvas-soft"
          >
            <Ban className="h-5 w-5 shrink-0 text-ink-muted" />
            <span className="flex-1 text-body text-ink">Blocked accounts</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
          </Link>
        </Card>
        <p className="mt-2 px-1 text-body-sm text-ink-faint">
          To report someone, open their profile or chat and use Report there — it reaches a
          moderator with the context attached.
        </p>
      </section>
    </main>
  )
}
