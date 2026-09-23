import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing, Calendar, Heart, MessageSquare, UserPlus } from 'lucide-react'
import { getMyProfile, updateProfile } from '#/server/profiles'
import { getVapidPublicKey, subscribePush, unsubscribePush } from '#/server/notifications'
import { PageHeader } from '#/components/PageHeader'
import { Card, Skeleton, Switch, useToast } from '#/components/ui'

export const Route = createFileRoute('/settings/notifications')({
  component: NotificationsSettingsPage,
})

type PushState = 'unsupported' | 'denied' | 'off' | 'on'

function NotificationsSettingsPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [pushState, setPushState] = useState<PushState>('off')
  const [pushBusy, setPushBusy] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => getMyProfile(),
  })

  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
    onError: () => toast('Could not save that. Try again.', { tone: 'error' }),
  })

  useEffect(() => {
    let cancelled = false
    const read = async () => {
      if (typeof window === 'undefined') return
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (!cancelled) setPushState('unsupported')
        return
      }
      if (Notification.permission === 'denied') {
        if (!cancelled) setPushState('denied')
        return
      }
      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      if (!cancelled) setPushState(existing ? 'on' : 'off')
    }
    void read()
    return () => {
      cancelled = true
    }
  }, [])

  const togglePush = async (next: boolean) => {
    setPushBusy(true)
    try {
      const registration = await navigator.serviceWorker.ready

      if (!next) {
        const existing = await registration.pushManager.getSubscription()
        if (existing) {
          await unsubscribePush({ data: { endpoint: existing.endpoint } })
          await existing.unsubscribe()
        }
        setPushState('off')
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushState(permission === 'denied' ? 'denied' : 'off')
        toast('Notifications are blocked in your browser settings.', { tone: 'error' })
        return
      }

      const publicKey = await getVapidPublicKey()
      if (!publicKey) {
        toast('Push is not configured on this server.', { tone: 'error' })
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      })
      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Incomplete subscription')
      }
      await subscribePush({
        data: { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
      })
      setPushState('on')
      toast('Push notifications on', { tone: 'success' })
    } catch {
      toast('Could not change push notifications.', { tone: 'error' })
    } finally {
      setPushBusy(false)
    }
  }

  const types = [
    {
      key: 'notifyMessages' as const,
      icon: <MessageSquare />,
      label: 'Messages',
      description: 'Someone sends you a message.',
    },
    {
      key: 'notifyFriends' as const,
      icon: <UserPlus />,
      label: 'Friend requests',
      description: 'Someone adds you, or accepts your request.',
    },
    {
      key: 'notifyMatches' as const,
      icon: <Heart />,
      label: 'Likes and matches',
      description: 'Someone likes you back.',
    },
    {
      key: 'notifyEvents' as const,
      icon: <Calendar />,
      label: 'Events',
      description: 'Organiser announcements and waitlist news.',
    },
  ]

  const pushOn = pushState === 'on'

  return (
    <main className="page-wrap py-5 pb-28">
      <PageHeader title="Notifications" back="/settings" />

      <section className="mb-7">
        <Card padding="none" className="px-4">
          <Switch
            leading={<BellRing />}
            label="Push notifications"
            description={
              pushState === 'unsupported'
                ? 'This browser does not support push notifications.'
                : pushState === 'denied'
                  ? 'Blocked in your browser settings — allow notifications there first.'
                  : 'Get notified on this device when the app is closed.'
            }
            checked={pushOn}
            disabled={pushBusy || pushState === 'unsupported' || pushState === 'denied'}
            onChange={togglePush}
          />
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-label text-ink-faint">Send me</h2>
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-card" />
        ) : (
          <Card padding="none" className="px-4">
            {types.map((type) => (
              <Switch
                key={type.key}
                leading={type.icon}
                label={type.label}
                description={type.description}
                checked={profile?.[type.key] ?? true}
                disabled={save.isPending}
                onChange={(next) => save.mutate({ data: { [type.key]: next } })}
              />
            ))}
          </Card>
        )}
        <p className="mt-2 px-1 text-body-sm text-ink-faint">
          These control push notifications only. Everything still appears in your notifications
          list in the app.
        </p>
      </section>
    </main>
  )
}
