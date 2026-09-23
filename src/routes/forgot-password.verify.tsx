import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useCallback, useState } from 'react'
import { MailQuestion, RefreshCw } from 'lucide-react'
import { sendPasswordResetOtp, verifyPasswordResetOtp } from '#/server/auth'
import { AuthAlert, AuthLayout } from '#/components/auth/AuthLayout'
import { OtpInput } from '#/components/auth/OtpInput'
import { useResendCountdown } from '#/hooks/useResendCountdown'
import { Button, EmptyState, useToast } from '#/components/ui'

export const Route = createFileRoute('/forgot-password/verify')({ component: VerifyOtpPage })

function VerifyOtpPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/forgot-password/verify' })
  const email = (search as any)?.email || ''
  const redirect = typeof (search as any)?.redirect === 'string' ? (search as any).redirect : ''
  const carry = redirect ? { redirect } : undefined
  const verifyPasswordResetOtpFn = useServerFn(verifyPasswordResetOtp)
  const sendPasswordResetOtpFn = useServerFn(sendPasswordResetOtp)
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
        const res = await verifyPasswordResetOtpFn({ data: { email, otp: code } })
        if (!res.valid) {
          setError('Invalid or expired code. Please try again.')
          setOtp('')
          setLoading(false)
          return
        }
        navigate({
          to: '/forgot-password/reset',
          search: { email, redirect },
          state: { resetOtp: code } as never,
        })
      } catch (err: any) {
        setError(err?.message || 'Something went wrong')
        setLoading(false)
      }
    },
    [email, loading, navigate, redirect, verifyPasswordResetOtpFn],
  )

  const handleResend = async () => {
    if (remaining > 0 || !email) return
    setResendLoading(true)
    setError('')
    try {
      await sendPasswordResetOtpFn({ data: email })
      markSent()
      setOtp('')
      toast('A new code is on its way.', { tone: 'success' })
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code.')
    } finally {
      setResendLoading(false)
    }
  }

  if (!email) {
    return (
      <AuthLayout title="We need your email" back={{ to: '/login', label: 'Back to log in' }}>
        <EmptyState
          icon={MailQuestion}
          title="Which account are you resetting?"
          description="Start again and we'll send a fresh code to your address."
          action={
            <Button onClick={() => navigate({ to: '/forgot-password', search: carry as never })}>
              Start over
            </Button>
          }
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      mode="step"
      step={{ current: 2, total: 3 }}
      back={{ to: '/forgot-password', search: carry, label: 'Back' }}
      title="Enter your code"
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
          Continue
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
            to="/forgot-password"
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
