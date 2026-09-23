export function formatClock(value: Date | string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function dayKey(value: Date | string) {
  const d = new Date(value)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function formatDayLabel(value: Date | string) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (dayKey(date) === dayKey(today)) return 'Today'
  if (dayKey(date) === dayKey(yesterday)) return 'Yesterday'

  const withinAWeek = Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000
  if (withinAWeek) return date.toLocaleDateString([], { weekday: 'long' })

  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  })
}

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

export function formatPresence(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const diff = Date.now() - new Date(value).getTime()
  if (diff < ONLINE_THRESHOLD_MS) return 'Active now'
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `Active ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Active ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `Active ${days}d ago`
  return null
}

export function isOnline(value: Date | string | null | undefined) {
  if (!value) return false
  return Date.now() - new Date(value).getTime() < ONLINE_THRESHOLD_MS
}
