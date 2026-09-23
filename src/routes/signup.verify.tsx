import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useCallback, useState } from 'react'
import { MailQuestion, RefreshCw } from 'lucide-react'
import { verifyEmailOtp, sendEmailVerificationOtp } from '#/server/auth'
import { AuthAlert, AuthLayout } from '#/components/auth/AuthLayout'
import { OtpInput } from '#/components/auth/OtpInput'
import { useResendCountdown } from '#/hooks/useResendCountdown'
import { Button, EmptyState, useToast } from '#/components/ui'

export const Route = createFileRoute('/signup/verify')({ component: SignupVerifyPage })

function isSafeRedirect(url: string) {
  return url.startsWith('/') && !url.startsWith('//')
}

function SignupVerifyPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/signup/verify' })
  const email = (search as any)?.email || ''
  const redirect = typeof (search as any)?.redirect === 'string' ? (search as any).redirect : ''
  const carry = redirect ? { redirect } : undefined
  const verifyEmailOtpFn = useServerFn(verifyEmailOtp)
  const sendEmailVerificationOtpFn = useServerFn(sendEmailVerificationOtp)
  const { toast } = useToast()

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const { remaining, markSent } = useResendCountdown(email)

  const submit = useCallback(
    async (code: string) => {
      if (code.length !== 6 || loading) return
      setError('')
      setLoading(true)

      try {
        const res = await verifyEmailOtpFn({ data: { email, otp: code } })
        if (!res.valid) {
          setError(res.message || 'Invalid or expired code. Please try again.')
          setOtp('')
          setLoading(false)
          return
        }
        // Full reload rather than a client navigation: the router context still
        // holds a session snapshot with emailVerified=false, and every loader on
        // the destination reads it.
        window.location.href = isSafeRedirect(redirect) ? redirect : '/discover'
      } catch (err: any) {
        setError(err?.message || 'Something went wrong')
        setLoading(false)
      }
    },
    [email, loading, redirect, verifyEmailOtpFn],
  )

  const handleResend = async () => {
    if (remaining > 0 || !email) return
    setResendLoading(true)
    setError('')
    try {
      await sendEmailVerificationOtpFn({ data: email })
      markSent()
      setOtp('')
      toast('A new code is on its way.', { tone: 'success' })
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code.')
    } finally {
      setResendLoading(false)
    }
  }

  // Landing here without an address means the flow was resumed from a cold
  // link. The old copy said "sign up again", which is wrong for the common
  // case — these people already have an account and only need the code
  // re-issued against their address.
  if (!email) {
    return (
      <AuthLayout title="We need your email" back={{ to: '/login', label: 'Back to log in' }}>
        <EmptyState
          icon={MailQuestion}
          title="Which address should we verify?"
          description="Log in again and we'll send a fresh code to the address on your account."
          action={
            <Button onClick={() => navigate({ to: '/login', search: carry as never })}>
              Go to log in
            </Button>
          }
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      mode="step"
      step={{ current: 2, total: 2 }}
      back={{ to: '/signup', search: carry, label: 'Back to sign up' }}
      title="Check your email"
      subtitle={
        <>
          We sent a 6-digit code to <span className="text-ink">{email}</span>.
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit(otp)
        }}
        className="flex flex-col gap-5"
      >
        <AuthAlert>{error}</AuthAlert>

        <OtpInput
          value={otp}
          onChange={(v) => {
            setOtp(v)
            if (error) setError('')
          }}
          onComplete={submit}
          invalid={!!error}
          disabled={loading}
        />

        <Button type="submit" size="lg" block loading={loading} disabled={otp.length !== 6}>
          Verify
        </Button>
      </form>

      <div className="mt-6 space-y-3 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading || remaining > 0}
          className="inline-flex items-center gap-1.5 text-body-sm text-ink underline underline-offset-2 transition disabled:no-underline disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
          {remaining > 0 ? `Resend code in ${remaining}s` : 'Resend code'}
        </button>
        <p className="text-caption text-ink-faint">
          Wrong address?{' '}
          <Link
            to="/signup"
            search={carry as never}
            className="text-ink-muted underline underline-offset-2"
          >
            Use a different email
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
