import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { sendPasswordResetOtp } from '#/server/auth'
import { EMAIL_REGEX } from '#/lib/auth-errors'
import { AuthAlert, AuthLayout } from '#/components/auth/AuthLayout'
import { markOtpSent } from '#/hooks/useResendCountdown'
import { Button, Field, Input } from '#/components/ui'

export const Route = createFileRoute('/forgot-password/')({ component: ForgotPasswordPage })

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/forgot-password/' })
  const redirect = typeof (search as any)?.redirect === 'string' ? (search as any).redirect : ''
  const carry = redirect ? { redirect } : undefined
  const sendPasswordResetOtpFn = useServerFn(sendPasswordResetOtp)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const normalizedEmail = email.toLowerCase().trim()
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      await sendPasswordResetOtpFn({ data: normalizedEmail })
      markOtpSent(normalizedEmail)
      navigate({
        to: '/forgot-password/verify',
        search: { email: normalizedEmail, redirect },
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to send code. Please try again.')
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      mode="step"
      step={{ current: 1, total: 3 }}
      back={{ to: '/login', search: carry, label: 'Back to log in' }}
      title="Reset your password"
      subtitle="Enter your email and we'll send you a 6-digit code."
      footer={
        <p className="text-center text-body-sm text-ink-muted">
          Remembered it?{' '}
          <Link
            to="/login"
            search={carry as never}
            className="text-ink underline underline-offset-2"
          >
            Log in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <AuthAlert>{error}</AuthAlert>

        <Field label="Email">
          {({ id, describedBy }) => (
            <Input
              id={id}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              required
              aria-describedby={describedBy}
            />
          )}
        </Field>

        <Button type="submit" size="lg" block loading={loading} className="mt-2">
          Send code
        </Button>
      </form>
    </AuthLayout>
  )
}
