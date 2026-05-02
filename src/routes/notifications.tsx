import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Heart, MessageCircle, Star, Bell, CheckCheck } from 'lucide-react'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '#/server/notifications'

export const Route = createFileRoute('/notifications')({ component: NotificationsPage })

const typeConfig: Record<string, { icon: typeof Heart; color: string; bg: string }> = {
  like: { icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10' },
  match: { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  message: { icon: MessageCircle, color: 'text-[var(--mag-green)]', bg: 'bg-[var(--mag-green)]/10' },
}

function NotificationsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
  })

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread-notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread-notifications'] })
    },
  })

  const unreadCount = notifications.filter((n: any) => !n.readAt).length

  const handleClick = (n: any) => {
    if (!n.readAt) {
      markReadMutation.mutate({ data: n.id })
    }
    if (n.link) {
      navigate({ to: n.link as any })
    }
  }

  return (
    <div className="page-wrap flex flex-1 flex-col px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => history.back()} className="rounded-full p-2 text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-[var(--mag-ink)]">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate({ data: undefined })}
            disabled={markAllMutation.isPending}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-3 py-1.5 text-[10px] font-semibold text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)] disabled:opacity-50"
          >
            <CheckCheck className="h-3 w-3" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Bell className="mb-3 h-12 w-12 text-[var(--mag-ink-muted)]" />
          <p className="text-sm text-[var(--mag-ink-soft)]">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const cfg = typeConfig[n.type] || { icon: Bell, color: 'text-[var(--mag-ink-muted)]', bg: 'bg-[var(--mag-surface)]' }
            const Icon = cfg.icon
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
                  n.readAt
                    ? 'border-[var(--mag-line)] bg-[var(--mag-card)] opacity-70'
                    : 'border-[var(--mag-green)]/30 bg-[var(--mag-green)]/5'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                  <Icon className={`h-5 w-5 ${cfg.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--mag-ink)]">{n.title}</p>
                  <p className="text-xs text-[var(--mag-ink-soft)]">{n.body}</p>
                  <p className="mt-1 text-[10px] text-[var(--mag-ink-muted)]" suppressHydrationWarning>
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.readAt && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--mag-green)]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
