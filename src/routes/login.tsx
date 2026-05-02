import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import { isEmailVerified, sendEmailVerificationOtp } from '#/server/auth'
import { normalizeAuthError, EMAIL_REGEX } from '#/lib/auth-errors'
import Logo from '#/components/Logo'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const navigate = useNavigate()
  const isEmailVerifiedFn = useServerFn(isEmailVerified)
  const sendEmailVerificationOtpFn = useServerFn(sendEmailVerificationOtp)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

      const { verified } = await isEmailVerifiedFn({ data: normalizedEmail })
      if (!verified) {
        const otpRes = await sendEmailVerificationOtpFn({ data: normalizedEmail })
        if (!otpRes.success && otpRes.message) {
          console.warn('OTP send warning:', otpRes.message)
        }
        navigate({ to: '/signup/verify', search: { email: normalizedEmail } })
        return
      }

      navigate({ to: '/discover' })
    } catch (err: any) {
      setError(normalizeAuthError(err?.message || ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-wrap flex min-h-[90vh] flex-col items-center px-4 py-8">
      <div className="mb-8 text-center">
        <Logo className="mx-auto mb-4 h-20 w-auto" />
        <h1 className="text-2xl font-bold text-[var(--mag-ink)]">Welcome Back</h1>
        <p className="mt-1 text-sm text-[var(--mag-ink-soft)]">Log in to continue swiping</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mag-ink-muted)]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
            />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mag-ink-muted)]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-10 text-sm text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setShowPassword((prev) => !prev)
              }}
              className="absolute right-0 top-0 z-10 flex h-full w-10 cursor-pointer items-center justify-center border-none bg-transparent text-[var(--mag-ink-muted)] transition hover:text-[var(--mag-ink)]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-[var(--mag-green)] no-underline hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--mag-green)] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--mag-green-dark)] disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Log In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-[var(--mag-ink-muted)]">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-[var(--mag-green)] no-underline hover:underline">
            Sign up
          </Link>
        </div>
      </div>

      <div className="mt-auto flex justify-center gap-4 pt-6 text-[10px] text-[var(--mag-ink-muted)]">
        <Link to="/terms" className="no-underline hover:text-[var(--mag-ink-soft)]">
          Terms of Service
        </Link>
        <Link to="/privacy" className="no-underline hover:text-[var(--mag-ink-soft)]">
          Privacy Policy
        </Link>
        <span className="text-[var(--mag-ink-muted)]">Cookie Policy</span>
      </div>
    </main>
  )
}
