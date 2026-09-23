import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { sendEmailVerificationOtp } from '#/server/auth'
import { normalizeAuthError, validatePassword, EMAIL_REGEX } from '#/lib/auth-errors'
import { AuthAlert, AuthLayout } from '#/components/auth/AuthLayout'
import { PasswordField } from '#/components/auth/PasswordField'
import { Button, Field, Input } from '#/components/ui'

export const Route = createFileRoute('/signup/')({ component: SignupPage })

function SignupPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/signup/' })
  const redirect = typeof (search as any)?.redirect === 'string' ? (search as any).redirect : ''
  const carry = redirect ? { redirect } : undefined
  const sendEmailVerificationOtpFn = useServerFn(sendEmailVerificationOtp)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { valid: passwordValid } = validatePassword(password)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')

    const normalizedEmail = email.toLowerCase().trim()
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!passwordValid) {
      setError('Please choose a stronger password.')
      return
    }

    setLoading(true)

    try {
      const res = await authClient.signUp.email({
        email: normalizedEmail,
        password,
        name: name.trim() || normalizedEmail.split('@')[0],
      })

      if (res.error) {
        setError(normalizeAuthError(res.error.message || ''))
        setLoading(false)
        return
      }

      // Try to send OTP, but redirect to verify either way so the user can resend
      const otpRes = await sendEmailVerificationOtpFn({ data: normalizedEmail })
      if (!otpRes.success && otpRes.message) {
        // Non-fatal: still redirect to verify page
        console.warn('OTP send warning:', otpRes.message)
      }
      navigate({ to: '/signup/verify', search: { email: normalizedEmail, redirect } })
    } catch (err: any) {
      setError(normalizeAuthError(err?.message || ''))
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Meet people at the events you're already going to — as friends, or more."
      back={{ to: '/login', search: carry, label: 'Back to log in' }}
      step={{ current: 1, total: 2 }}
      footer={
        <p className="text-center text-body-sm text-ink-muted">
          Already have an account?{' '}
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

        <Field label="Name" hint="This is what people will see.">
          {({ id, describedBy }) => (
            <Input
              id={id}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              autoFocus
              aria-describedby={describedBy}
            />
          )}
        </Field>

        <Field label="Email">
          {({ id, describedBy }) => (
            <Input
              id={id}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              aria-describedby={describedBy}
            />
          )}
        </Field>

        <PasswordField
          value={password}
          onChange={setPassword}
          placeholder="Choose a password"
          autoComplete="new-password"
          showStrength
        />

        <Button type="submit" size="lg" block loading={loading} className="mt-2">
          Continue
        </Button>

        <p className="text-center text-caption text-ink-faint">
          By continuing you agree to our{' '}
          <Link to="/terms" className="underline underline-offset-2">Terms</Link> and{' '}
          <Link to="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
        </p>
      </form>
    </AuthLayout>
  )
}
