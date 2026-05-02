import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check, X } from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import { sendEmailVerificationOtp } from '#/server/auth'
import { normalizeAuthError, validatePassword, EMAIL_REGEX } from '#/lib/auth-errors'
import Logo from '#/components/Logo'

export const Route = createFileRoute('/signup/')({ component: SignupPage })

function SignupPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/signup/' })
  const redirect = typeof (search as any)?.redirect === 'string' ? (search as any).redirect : ''
  const sendEmailVerificationOtpFn = useServerFn(sendEmailVerificationOtp)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { valid: passwordValid, requirements } = validatePassword(password)

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
    <main className="page-wrap flex min-h-[90vh] flex-col items-center px-4 py-8">
      <div className="mb-8 text-center">
        <Logo className="mx-auto mb-4 h-20 w-auto" />
        <h1 className="text-2xl font-bold text-[var(--mag-ink)]">Join Meet & Greet</h1>
        <p className="mt-1 text-sm text-[var(--mag-ink-soft)]">Create your account to start matching</p>
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
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
            />
          </div>

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

          {password.length > 0 && (
            <ul className="space-y-1">
              {requirements.map((r) => (
                <li key={r.label} className="flex items-center gap-1.5 text-[11px] text-[var(--mag-ink-muted)]">
                  {r.met ? <Check className="h-3 w-3 text-[var(--mag-green)]" /> : <X className="h-3 w-3 text-red-400" />}
                  <span className={r.met ? 'text-[var(--mag-ink-soft)]' : ''}>{r.label}</span>
                </li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--mag-green)] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--mag-green-dark)] disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-[var(--mag-ink-muted)]">
          Already have an account?{' '}
          <Link to="/login" search={redirect ? { redirect } : undefined} className="font-semibold text-[var(--mag-green)] no-underline hover:underline">
            Log in
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
