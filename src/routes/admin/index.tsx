import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Calendar,
  MessageSquare,
  Flag,
  Shield,
  Ban,
  CheckCircle,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  AlertTriangle,
  Lock,
  Unlock,
  Crown,
  User as UserIcon,
  XCircle,
  Star,
} from 'lucide-react'
import {
  getAdminStats,
  getAllUsers,
  getAllEvents,
  getAllReports,
  getFlaggedUsers,
  getEventsWithSponsors,
  updateUserRole,
  toggleUserDisabled,
  adminDeleteEvent,
  adminToggleEventActive,
  deleteReport,
  dismissReport,
  reviewReport,
  dismissAllReportsForUser,
} from '#/server/admin'
import { getSession } from '#/server/auth'
import AvatarImage from '#/components/AvatarImage'

export const Route = createFileRoute('/admin/')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session?.user) {
      throw redirect({ to: '/login' })
    }
    // Re-fetch user to check role (getSession may not include role)
    const { requireAdmin } = await import('#/server/auth')
    try {
      await requireAdmin()
    } catch {
      throw redirect({ to: '/' })
    }
    return { session }
  },
  component: AdminPage,
})

type Tab = 'overview' | 'users' | 'events' | 'reports' | 'moderation' | 'sponsors'

function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="page-wrap flex flex-1 flex-col px-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-[var(--mag-green)]" />
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={<Activity className="h-4 w-4" />} label="Overview" />
        <TabButton active={tab === 'users'} onClick={() => setTab('users')} icon={<Users className="h-4 w-4" />} label="Users" />
        <TabButton active={tab === 'events'} onClick={() => setTab('events')} icon={<Calendar className="h-4 w-4" />} label="Events" />
        <TabButton active={tab === 'sponsors'} onClick={() => setTab('sponsors')} icon={<Star className="h-4 w-4" />} label="Sponsors" />
        <TabButton active={tab === 'reports'} onClick={() => setTab('reports')} icon={<Flag className="h-4 w-4" />} label="Reports" />
        <TabButton active={tab === 'moderation'} onClick={() => setTab('moderation')} icon={<Shield className="h-4 w-4" />} label="Moderation" />
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'events' && <EventsTab />}
      {tab === 'sponsors' && <SponsorsTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'moderation' && <ModerationTab />}
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-[var(--mag-green)] text-white'
          : 'bg-[var(--mag-surface)] text-[var(--mag-ink-soft)] hover:bg-[var(--mag-line)]'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

/* ---------- OVERVIEW ---------- */
function OverviewTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => getAdminStats(),
  })

  if (isLoading) return <div className="text-sm text-[var(--mag-ink-muted)]">Loading stats...</div>
  if (!stats) return <div className="text-sm text-red-500">Failed to load stats</div>

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users className="h-5 w-5" />, color: 'text-blue-500' },
    { label: 'Active Events', value: stats.activeEvents, icon: <Calendar className="h-5 w-5" />, color: 'text-[var(--mag-green)]' },
    { label: 'Total Matches', value: stats.totalMatches, icon: <MessageSquare className="h-5 w-5" />, color: 'text-purple-500' },
    { label: 'Total Messages', value: stats.totalMessages, icon: <Activity className="h-5 w-5" />, color: 'text-amber-500' },
    { label: 'Total Reports', value: stats.totalReports, icon: <Flag className="h-5 w-5" />, color: 'text-red-500' },
    { label: 'New Users (7d)', value: stats.recentUsers, icon: <UserIcon className="h-5 w-5" />, color: 'text-cyan-500' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4">
          <div className={`mb-2 ${c.color}`}>{c.icon}</div>
          <div className="text-2xl font-bold text-[var(--mag-ink)]">{c.value.toLocaleString()}</div>
          <div className="text-xs text-[var(--mag-ink-muted)]">{c.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ---------- USERS ---------- */
function UsersTab() {
  const [search, setSearch] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [filter, setFilter] = useState<'all' | 'admin' | 'user' | 'active' | 'disabled'>('all')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, cursor],
    queryFn: () => getAllUsers({ data: { search: search || undefined, cursor, limit: 50 } }),
  })

  const roleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const disableMutation = useMutation({
    mutationFn: toggleUserDisabled,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const filteredItems =
    data?.items.filter((user: any) => {
      switch (filter) {
        case 'admin':
          return user.role === 'admin'
        case 'user':
          return user.role !== 'admin'
        case 'active':
          return !user.disabledAt
        case 'disabled':
          return user.disabledAt
        default:
          return true
      }
    }) ?? []

  const statCounts = {
    all: data?.items.length ?? 0,
    admin: data?.items.filter((u: any) => u.role === 'admin').length ?? 0,
    user: data?.items.filter((u: any) => u.role !== 'admin').length ?? 0,
    active: data?.items.filter((u: any) => !u.disabledAt).length ?? 0,
    disabled: data?.items.filter((u: any) => u.disabledAt).length ?? 0,
  }

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: `All (${statCounts.all})` },
    { key: 'admin', label: `Admins (${statCounts.admin})` },
    { key: 'user', label: `Users (${statCounts.user})` },
    { key: 'active', label: `Active (${statCounts.active})` },
    { key: 'disabled', label: `Disabled (${statCounts.disabled})` },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mag-ink-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCursor(undefined); setFilter('all') }}
          placeholder="Search by name or email..."
          className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-2.5 pl-9 pr-4 text-sm text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
              filter === f.key
                ? 'bg-[var(--mag-green)] text-white'
                : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-8 text-center text-sm text-[var(--mag-ink-muted)]">Loading users...</div>
      ) : filteredItems.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--mag-ink-muted)]">
          {search ? 'No users match your search.' : 'No users found.'}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--mag-line)] rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] overflow-hidden">
          {filteredItems.map((user: any) => (
            <div key={user.id} className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[var(--mag-surface)]">
              {/* Avatar — always wrapped in fixed-size rounded container */}
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--mag-surface)]">
                <AvatarImage src={user.image} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-[var(--mag-ink)]">{user.name || user.email}</span>
                  {user.role === 'admin' && (
                    <span className="shrink-0 rounded bg-amber-100 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      admin
                    </span>
                  )}
                  {user.disabledAt && (
                    <span className="shrink-0 rounded bg-red-100 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      disabled
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--mag-ink-muted)]">{user.email}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--mag-ink-muted)]">
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  <span className="text-[var(--mag-line)]">·</span>
                  <span>{user._count.sessions} sessions</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => roleMutation.mutate({ data: { userId: user.id, role: user.role === 'admin' ? 'user' : 'admin' } })}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-surface)] text-[var(--mag-ink-muted)] transition hover:bg-[var(--mag-line)] disabled:opacity-40"
                  title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                  disabled={roleMutation.isPending}
                >
                  {user.role === 'admin' ? <Unlock className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`${user.disabledAt ? 'Enable' : 'Disable'} ${user.name || user.email}?`)) {
                      disableMutation.mutate({ data: { userId: user.id, disabled: !user.disabledAt } })
                    }
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition disabled:opacity-40 ${
                    user.disabledAt
                      ? 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                  }`}
                  title={user.disabledAt ? 'Enable account' : 'Disable account'}
                  disabled={disableMutation.isPending}
                >
                  {user.disabledAt ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.nextCursor || cursor) && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCursor(undefined)}
            disabled={!cursor}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-surface)] text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-line)] disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCursor(data?.nextCursor || undefined)}
            disabled={!data?.nextCursor}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-surface)] text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-line)] disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------- EVENTS ---------- */
function EventsTab() {
  const [cursor, setCursor] = useState<string | undefined>()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-events', cursor],
    queryFn: () => getAllEvents({ data: { cursor, limit: 50 } }),
  })

  const deleteMutation = useMutation({
    mutationFn: adminDeleteEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-events'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: adminToggleEventActive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-events'] }),
  })

  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <div className="text-sm text-[var(--mag-ink-muted)]">Loading events...</div>
      ) : (
        <>
          <div className="space-y-2">
            {data?.items.map((event: any) => (
              <div key={event.id} className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-3">
                <div className="flex items-start gap-3">
                  {event.photo ? (
                    <img src={event.photo} alt={event.name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--mag-surface)]">
                      <Calendar className="h-5 w-5 text-[var(--mag-ink-muted)]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--mag-ink)]">{event.name}</span>
                      {!event.isActive && <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-900/20">Inactive</span>}
                      {event.endedAt && <span className="shrink-0 rounded-full bg-[var(--mag-ink-muted)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--mag-ink-muted)]">Ended</span>}
                    </div>
                    <div className="text-xs text-[var(--mag-ink-muted)]">{event.location || 'No location'}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[var(--mag-ink-muted)]">
                      <span>{event._count.attendees} attendees</span>
                      <span>{event._count.swipes} swipes</span>
                      <span>{event._count.matches} matches</span>
                      <span>{event._count.waitlist} waitlist</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => toggleMutation.mutate({ data: { eventId: event.id, active: !event.isActive } })}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-[var(--mag-surface)] py-1.5 text-[10px] font-medium text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-line)]"
                    disabled={toggleMutation.isPending}
                  >
                    {event.isActive ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    {event.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this event and all its data?')) {
                        deleteMutation.mutate({ data: event.id })
                      }
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-red-50 py-1.5 text-[10px] font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-900/20"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {data && data.items.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--mag-ink-muted)]">No events found</div>
          )}

          {(data?.nextCursor || cursor) && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCursor(undefined)}
                disabled={!cursor}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-surface)] text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-line)] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCursor(data?.nextCursor || undefined)}
                disabled={!data?.nextCursor}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-surface)] text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-line)] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ---------- REPORTS ---------- */
function ReportsTab() {
  const [cursor, setCursor] = useState<string | undefined>()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', cursor],
    queryFn: () => getAllReports({ data: { cursor, limit: 50 } }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  })

  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <div className="text-sm text-[var(--mag-ink-muted)]">Loading reports...</div>
      ) : (
        <>
          <div className="space-y-2">
            {data?.items.map((report: any) => (
              <div key={report.id} className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-medium text-[var(--mag-ink-soft)]">{new Date(report.createdAt).toLocaleString()}</span>
                </div>
                <div className="mb-2 text-sm text-[var(--mag-ink)]">{report.reason}</div>
                <div className="mb-2 flex gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <AvatarImage src={report.reporter?.image} className="h-5 w-5" />
                    <span className="text-[var(--mag-ink-muted)]">Reporter:</span>
                    <span className="font-medium text-[var(--mag-ink)]">{report.reporter?.name || report.reporter?.email || 'Unknown'}</span>
                    {report.reporter?.disabledAt && <Ban className="h-3 w-3 text-red-500" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AvatarImage src={report.reported?.image} className="h-5 w-5" />
                    <span className="text-[var(--mag-ink-muted)]">Reported:</span>
                    <span className="font-medium text-[var(--mag-ink)]">{report.reported?.name || report.reported?.email || 'Unknown'}</span>
                    {report.reported?.disabledAt && <Ban className="h-3 w-3 text-red-500" />}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Delete this report?')) {
                      deleteMutation.mutate({ data: report.id })
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--mag-surface)] px-2 py-1 text-[10px] font-medium text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-line)]"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" /> Delete Report
                </button>
              </div>
            ))}
          </div>

          {data && data.items.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--mag-ink-muted)]">No reports found</div>
          )}

          {(data?.nextCursor || cursor) && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCursor(undefined)}
                disabled={!cursor}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-surface)] text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-line)] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCursor(data?.nextCursor || undefined)}
                disabled={!data?.nextCursor}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-surface)] text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-line)] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ---------- MODERATION ---------- */
function ModerationTab() {
  const queryClient = useQueryClient()

  const { data: flaggedUsers, isLoading: flaggedLoading } = useQuery({
    queryKey: ['admin-flagged-users'],
    queryFn: () => getFlaggedUsers(),
  })

  const { data: pendingReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-pending-reports'],
    queryFn: () => getAllReports({ data: { status: 'pending', limit: 100 } }),
  })

  const dismissMutation = useMutation({
    mutationFn: dismissReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flagged-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pending-reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
    },
  })

  const reviewMutation = useMutation({
    mutationFn: reviewReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flagged-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pending-reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
    },
  })

  const dismissAllMutation = useMutation({
    mutationFn: dismissAllReportsForUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flagged-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pending-reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
    },
  })

  const disableMutation = useMutation({
    mutationFn: toggleUserDisabled,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flagged-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Flagged Users */}
      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--mag-ink-muted)]">
          Flagged Users ({flaggedUsers?.length ?? 0})
        </h2>
        {flaggedLoading ? (
          <div className="text-sm text-[var(--mag-ink-muted)]">Loading flagged users...</div>
        ) : !flaggedUsers || flaggedUsers.length === 0 ? (
          <div className="py-6 text-center text-sm text-[var(--mag-ink-muted)]">No flagged users</div>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--mag-line)] rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] overflow-hidden">
            {flaggedUsers.map((user: any) => (
              <div key={user.id} className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[var(--mag-surface)]">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--mag-surface)]">
                  <AvatarImage src={user.image} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-[var(--mag-ink)]">{user.name || user.email}</span>
                    <span className="shrink-0 rounded bg-red-100 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {user.reportCount} reports
                    </span>
                    {user.disabledAt && (
                      <span className="shrink-0 rounded bg-red-100 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        disabled
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--mag-ink-muted)]">{user.email}</div>
                  <div className="mt-0.5 text-[10px] text-[var(--mag-ink-muted)]">
                    Latest: {user.latestReason}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (confirm(`Ban ${user.name || user.email}? This will disable their account and end all sessions.`)) {
                        disableMutation.mutate({ data: { userId: user.id, disabled: true } })
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                    title="Ban user"
                    disabled={disableMutation.isPending || user.disabledAt}
                  >
                    <Ban className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Dismiss all pending reports for ${user.name || user.email}?`)) {
                        dismissAllMutation.mutate({ data: { userId: user.id } })
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-surface)] text-[var(--mag-ink-muted)] transition hover:bg-[var(--mag-line)]"
                    title="Dismiss all reports"
                    disabled={dismissAllMutation.isPending}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Reports */}
      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--mag-ink-muted)]">
          Pending Reports
        </h2>
        {reportsLoading ? (
          <div className="text-sm text-[var(--mag-ink-muted)]">Loading pending reports...</div>
        ) : !pendingReports?.items || pendingReports.items.length === 0 ? (
          <div className="py-6 text-center text-sm text-[var(--mag-ink-muted)]">No pending reports</div>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--mag-line)] rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] overflow-hidden">
            {pendingReports.items.map((report: any) => (
              <div key={report.id} className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[var(--mag-surface)]">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-[var(--mag-ink)]">{report.reason}</span>
                    <span className="shrink-0 rounded bg-amber-100 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      pending
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-[var(--mag-ink-muted)]">
                    <span>Reporter: {report.reporter?.name || report.reporter?.email || 'Unknown'}</span>
                    <span className="text-[var(--mag-line)]">·</span>
                    <span>Reported: {report.reported?.name || report.reported?.email || 'Unknown'}</span>
                    <span className="text-[var(--mag-line)]">·</span>
                    <span>{new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => reviewMutation.mutate({ data: { reportId: report.id } })}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600 transition hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                    title="Mark reviewed"
                    disabled={reviewMutation.isPending}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => dismissMutation.mutate({ data: { reportId: report.id } })}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-surface)] text-[var(--mag-ink-muted)] transition hover:bg-[var(--mag-line)]"
                    title="Dismiss report"
                    disabled={dismissMutation.isPending}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- SPONSORS ---------- */
function SponsorsTab() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-sponsors'],
    queryFn: () => getEventsWithSponsors(),
  })

  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <div className="text-sm text-[var(--mag-ink-muted)]">Loading sponsors...</div>
      ) : (
        <>
          <div className="space-y-2">
            {events?.map((event: any) => (
              <div key={event.id} className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-3">
                <div className="flex items-start gap-3">
                  {event.photo ? (
                    <img src={event.photo} alt={event.name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--mag-surface)]">
                      <Calendar className="h-5 w-5 text-[var(--mag-ink-muted)]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--mag-ink)]">{event.name}</span>
                      <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Star className="h-3 w-3" /> Sponsored
                      </span>
                    </div>
                    <div className="text-xs text-[var(--mag-ink-muted)]">{event.location || 'No location'}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[var(--mag-ink-muted)]">
                      <span>{event._count.attendees} attendees</span>
                      <span>Code: {event.code}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {event.sponsorName && (
                        <p className="text-xs text-[var(--mag-ink)]">
                          <span className="font-medium">Sponsor:</span> {event.sponsorName}
                        </p>
                      )}
                      {event.sponsorLogo && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--mag-ink-muted)]">Logo:</span>
                          <img src={event.sponsorLogo} alt="Sponsor logo" className="h-5 max-w-[120px] object-contain" />
                        </div>
                      )}
                      {event.sponsorFrameUrl && (
                        <p className="text-[10px] text-[var(--mag-ink-muted)]">Frame image set</p>
                      )}
                    </div>
                    <div className="mt-1 text-[10px] text-[var(--mag-ink-muted)]">
                      Creator: {event.creator?.name || event.creator?.email || 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {events && events.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--mag-ink-muted)]">No sponsored events found</div>
          )}
        </>
      )}
    </div>
  )
}
