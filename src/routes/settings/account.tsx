import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AtSign, KeyRound, ShieldCheck, Trash2 } from 'lucide-react'
import { disableMyAccount, getSession } from '#/server/auth'
import { PageHeader } from '#/components/PageHeader'
import { Badge, Button, Card, Sheet, Skeleton, useToast } from '#/components/ui'

export const Route = createFileRoute('/settings/account')({ component: AccountSettingsPage })

function AccountSettingsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const { data: session, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: () => getSession(),
  })

  const disable = useMutation({
    mutationFn: () => disableMyAccount(),
    onSuccess: () => {
      window.location.href = '/'
    },
    onError: () => {
      setConfirmDelete(false)
      toast('Could not delete the account. Try again.', { tone: 'error' })
    },
  })

  const email = session?.user?.email ?? ''
  const verified = !!session?.user?.emailVerified

  return (
    <main className="page-wrap py-5 pb-28">
      <PageHeader title="Account" back="/settings" />

      <section className="mb-7">
        <h2 className="mb-2 text-label text-ink-faint">Sign-in</h2>
        <Card padding="none">
          <div className="flex items-start gap-3 border-b border-hairline-soft px-4 py-3.5">
            <AtSign className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm text-ink-muted">Email</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-4 w-40 rounded-full" />
              ) : (
                <p className="truncate text-body text-ink">{email}</p>
              )}
            </div>
            {!isLoading &&
              (verified ? (
                <Badge tone="neutral" className="mt-0.5">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </Badge>
              ) : (
                <Badge tone="danger" className="mt-0.5">Unverified</Badge>
              ))}
          </div>

          <Link
            to="/forgot-password"
            className="flex items-center gap-3 px-4 py-3.5 no-underline transition hover:bg-canvas-soft"
          >
            <KeyRound className="h-5 w-5 shrink-0 text-ink-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-body text-ink">Change password</p>
              <p className="text-body-sm text-ink-muted">
                We'll email you a code to set a new one.
              </p>
            </div>
          </Link>
        </Card>
        <p className="mt-2 px-1 text-body-sm text-ink-faint">
          Your email address is how you sign in and can't be changed here. Contact support if you
          need it moved.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-label text-ink-faint">Danger zone</h2>
        <Card padding="none">
          <button
            type="button"
            onClick={() => {
              setConfirmText('')
              setConfirmDelete(true)
            }}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-danger-soft"
          >
            <Trash2 className="h-5 w-5 shrink-0 text-danger" />
            <div className="min-w-0 flex-1">
              <p className="text-body text-danger">Delete account</p>
              <p className="text-body-sm text-ink-muted">
                Removes you from discovery, events and chats.
              </p>
            </div>
          </button>
        </Card>
      </section>

      <Sheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete your account?"
        description="Your profile is removed from discovery, events and every chat. Your email is permanently blocked from registering again. This cannot be undone."
        footer={
          <>
            <Button variant="ghost" block onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              block
              disabled={confirmText.trim().toLowerCase() !== 'delete'}
              loading={disable.isPending}
              onClick={() => disable.mutate()}
            >
              Delete
            </Button>
          </>
        }
      >
        <label htmlFor="confirm-delete" className="mb-2 block text-body-sm font-semibold text-ink-soft">
          Type DELETE to confirm
        </label>
        <input
          id="confirm-delete"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          className="h-11 w-full rounded-full border border-transparent bg-field px-4 text-body text-ink outline-none focus:border-danger focus:ring-1 focus:ring-danger"
        />
      </Sheet>

      <Button variant="ghost" block className="mt-8" onClick={() => navigate({ to: '/settings' })}>
        Back to settings
      </Button>
    </main>
  )
}
