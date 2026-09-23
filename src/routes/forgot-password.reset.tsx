import {
  createFileRoute,
  useNavigate,
  useRouterState,
  useSearch,
} from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { resetPasswordWithOtp } from '#/server/auth'
import { normalizeAuthError, validatePassword } from '#/lib/auth-errors'
import { AuthAlert, AuthLayout } from '#/components/auth/AuthLayout'
import { PasswordField } from '#/components/auth/PasswordField'
import { Button, EmptyState, useToast } from '#/components/ui'

export const Route = createFileRoute('/forgot-password/reset')({ component: ResetPasswordPage })

function isSafeRedirect(url: string) {
  return url.startsWith('/') && !url.startsWith('//')
}

function ResetPasswordPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/forgot-password/reset' })
  const email = (search as any)?.email || ''
  const redirect = typeof (search as any)?.redirect === 'string' ? (search as any).redirect : ''
  const carry = redirect ? { redirect } : undefined

  const resetOtp = useRouterState({
    select: (s) => (s.location.state as { resetOtp?: string } | undefined)?.resetOtp ?? '',
  })

  const resetPasswordWithOtpFn = useServerFn(resetPasswordWithOtp)
  const { toast } = useToast()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmError, setConfirmError] = useState('')

  const { valid: passwordValid } = validatePassword(password)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    setConfirmError('')

    if (!passwordValid) {
      setError('Please choose a stronger password.')
      return
    }
    if (password !== confirm) {
      setConfirmError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await resetPasswordWithOtpFn({
        data: { email, otp: resetOtp, password },
      })
      if (!res.success && res.message) {
        setError(normalizeAuthError(res.message))
        setLoading(false)
        return
      }
      toast('Password updated. Log in with your new password.', { tone: 'success', duration: 6000 })
      navigate({
        to: '/login',
        search: (redirect && isSafeRedirect(redirect) ? { redirect } : undefined) as never,
      })
    } catch (err: any) {
      setError(normalizeAuthError(err?.message || ''))
      setLoading(false)
    }
  }

  if (!email || !resetOtp) {
    return (
      <AuthLayout title="Let's start again" back={{ to: '/login', label: 'Back to log in' }}>
        <EmptyState
          icon={KeyRound}
          title="This reset link expired"
          description="For your security the code is only held for the current session. Request a new one and you'll be through in a moment."
          action={
            <Button onClick={() => navigate({ to: '/forgot-password', search: carry as never })}>
              Request a new code
            </Button>
          }
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      mode="step"
      step={{ current: 3, total: 3 }}
      back={{ to: '/forgot-password/verify', search: { email, ...(carry ?? {}) }, label: 'Back' }}
      title="Choose a new password"
      subtitle={
        <>
          For <span className="text-ink">{email}</span>. You'll be signed out everywhere else.
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <AuthAlert>{error}</AuthAlert>

        <PasswordField
          label="New password"
          value={password}
          onChange={setPassword}
          placeholder="New password"
          autoComplete="new-password"
          autoFocus
          showStrength
        />

        <PasswordField
          label="Confirm password"
          value={confirm}
          onChange={(v) => {
            setConfirm(v)
            if (confirmError) setConfirmError('')
          }}
          placeholder="Repeat it"
          autoComplete="new-password"
          error={confirmError}
        />

        <Button type="submit" size="lg" block loading={loading} className="mt-2">
          Update password
        </Button>
      </form>
    </AuthLayout>
  )
}
