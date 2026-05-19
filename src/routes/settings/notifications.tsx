import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Bell, MessageSquare, Heart, Zap } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/settings/notifications')({ component: NotificationsSettingsPage })

function Toggle({ label, icon: Icon, defaultOn = true }: { label: string; icon: React.ElementType; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="h-5 w-5 text-[var(--mag-ink-soft)]" />
      <span className="flex-1 text-sm text-[var(--mag-ink)]">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-[var(--mag-ink)]' : 'bg-[var(--mag-line)]'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

function NotificationsSettingsPage() {
  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <Link to="/settings" className="rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)] no-underline">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Notifications</h1>
      </div>

      <div className="overflow-hidden rounded-none border border-[var(--mag-line)] bg-[var(--mag-card)]">
        <Toggle label="New Matches" icon={Heart} />
        <Toggle label="New Messages" icon={MessageSquare} />
        <Toggle label="Likes You" icon={Zap} />
        <Toggle label="Top Picks Available" icon={Bell} />
        <Toggle label="Promotions & Offers" icon={Bell} defaultOn={false} />
      </div>
    </main>
  )
}
