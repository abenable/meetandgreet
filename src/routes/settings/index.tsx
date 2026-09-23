import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Ban,
  Bell,
  ChevronRight,
  Compass,
  Info,
  LogOut,
  Moon,
  Shield,
  Sun,
  UserCog,
  UserRound,
} from 'lucide-react'
import { useTheme } from '#/hooks/useTheme'
import { Button, Card, Sheet, Switch, useToast } from '#/components/ui'
import { useState } from 'react'

export const Route = createFileRoute('/settings/')({ component: SettingsPage })

const SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: UserRound, label: 'Edit profile', to: '/profile/edit' },
      { icon: UserCog, label: 'Account', to: '/settings/account' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Compass, label: 'Discovery', to: '/settings/discovery' },
      { icon: Bell, label: 'Notifications', to: '/settings/notifications' },
    ],
  },
  {
    title: 'Safety',
    items: [
      { icon: Shield, label: 'Privacy', to: '/settings/privacy' },
      { icon: Ban, label: 'Blocked accounts', to: '/settings/blocked' },
      { icon: Info, label: 'About', to: '/about' },
    ],
  },
]

function SettingsPage() {
  const { theme, toggleTheme, mounted } = useTheme()
  const qc = useQueryClient()
  const { toast } = useToast()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const logout = useMutation({
    mutationFn: async () => {
      const { authClient } = await import('#/lib/auth-client')
      await authClient.signOut()
    },
    onSuccess: () => {
      qc.clear()
      window.location.href = '/login'
    },
    onError: () => {
      setConfirmLogout(false)
      toast('Could not log out. Try again.', { tone: 'error' })
    },
  })

  return (
    <main className="page-wrap py-5 pb-28">
      <h1 className="mb-6 text-h1 text-ink">Settings</h1>

      <div className="space-y-7">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 text-label text-ink-faint">{section.title}</h2>
            <Card padding="none">
              {section.items.map((item, i) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3.5 no-underline transition hover:bg-canvas-soft ${
                    i < section.items.length - 1 ? 'border-b border-hairline-soft' : ''
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0 text-ink-muted" />
                  <span className="flex-1 text-body text-ink">{item.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
                </Link>
              ))}
            </Card>
          </section>
        ))}

        <section>
          <h2 className="mb-2 text-label text-ink-faint">Appearance</h2>
          <Card padding="none" className="px-4">
            <Switch
              leading={mounted && theme === 'dark' ? <Sun /> : <Moon />}
              label="Dark mode"
              checked={mounted ? theme === 'dark' : false}
              onChange={toggleTheme}
            />
          </Card>
        </section>

        <Button
          variant="outline"
          block
          size="lg"
          onClick={() => setConfirmLogout(true)}
          className="text-ink-muted"
        >
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </div>

      <Sheet
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Log out?"
        description="You'll need your email and password to get back in."
        footer={
          <>
            <Button variant="outline" block onClick={() => setConfirmLogout(false)}>
              Cancel
            </Button>
            <Button block loading={logout.isPending} onClick={() => logout.mutate()}>
              Log out
            </Button>
          </>
        }
      />
    </main>
  )
}
