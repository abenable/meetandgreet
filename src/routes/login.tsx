import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { getSession, sendEmailVerificationOtp } from '#/server/auth'
import { normalizeAuthError, EMAIL_REGEX } from '#/lib/auth-errors'
import { AuthAlert, AuthLayout } from '#/components/auth/AuthLayout'
import { PasswordField } from '#/components/auth/PasswordField'
import { Button, Field, Input } from '#/components/ui'

export const Route = createFileRoute('/login')({ component: LoginPage })

function isSafeRedirect(url: string) {
  return url.startsWith('/') && !url.startsWith('//')
}

function LoginPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' })
  const redirect = typeof (search as any)?.redirect === 'string' ? (search as any).redirect : ''
  const carry = redirect ? { redirect } : undefined
  const getSessionFn = useServerFn(getSession)
  const sendEmailVerificationOtpFn = useServerFn(sendEmailVerificationOtp)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')

    const normalizedEmail = email.toLowerCase().trim()
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)

    try {
      const res = await authClient.signIn.email({ email: normalizedEmail, password })
      if (res.error) {
        setError(normalizeAuthError(res.error.message || ''))
        setLoading(false)
        return
      }

      // Read verification state off our own session rather than asking about
      // an arbitrary address — the old isEmailVerified endpoint took any email
      // with no session and doubled as an account-existence oracle. The server
      // enforces this too: requireSession() rejects unverified sessions, so
      // this branch is UX, not security — which is why it diverts only when it
      // positively knows the address is unconfirmed. Reading an empty session
      // as "unverified" sent people who had already passed OTP back through it.
      const session = await getSessionFn()
      if (session?.user && !session.user.emailVerified) {
        await sendEmailVerificationOtpFn({ data: normalizedEmail })
        navigate({ to: '/signup/verify', search: { email: normalizedEmail, redirect } })
        return
      }

      navigate({ to: isSafeRedirect(redirect) ? redirect : '/discover' })
    } catch (err: any) {
      setError(normalizeAuthError(err?.message || ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Pick up where you left off."
      back={{ to: '/', label: 'Back to home' }}
      footer={
        <p className="text-center text-body-sm text-ink-muted">
          New here?{' '}
          <Link
            to="/signup"
            search={carry as never}
            className="text-ink underline underline-offset-2"
          >
            Create an account
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

        <PasswordField
          value={password}
          onChange={setPassword}
          placeholder="Your password"
          autoComplete="current-password"
        />

        <div className="-mt-1 text-right">
          <Link
            to="/forgot-password"
            search={carry as never}
            className="text-body-sm text-ink-muted underline underline-offset-2 hover:text-ink"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" block loading={loading} className="mt-2">
          Log in
        </Button>
      </form>
    </AuthLayout>
  )
}
