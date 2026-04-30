import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Flame, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { resetPasswordWithOtp } from '#/server/auth'

export const Route = createFileRoute('/forgot-password/reset')({ component: ResetPasswordPage })

function ResetPasswordPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/forgot-password/reset' })
  const email = (search as any)?.email || ''
  const otp = (search as any)?.otp || ''
  const resetPasswordWithOtpFn = useServerFn(resetPasswordWithOtp)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      await resetPasswordWithOtpFn({ data: { email, otp, password } })
      navigate({ to: '/discover' })
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!email || !otp) {
    return (
      <main className="page-wrap flex min-h-[90vh] flex-col items-center justify-center px-4 py-8 text-center">
        <Flame className="mb-4 inline-block h-14 w-14 fill-[var(--mag-green)] text-[var(--mag-green)]" />
        <h1 className="text-2xl font-bold text-[var(--mag-ink)]">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--mag-ink-soft)]">Please start the password reset flow again.</p>
        <button
          onClick={() => navigate({ to: '/forgot-password' })}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--mag-green)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--mag-green-dark)]"
        >
          Start over <ArrowRight className="h-4 w-4" />
        </button>
      </main>
    )
  }

  return (
    <main className="page-wrap flex min-h-[90vh] flex-col items-center px-4 py-8">
      <div className="mb-8 text-center">
        <Flame className="mb-4 inline-block h-14 w-14 fill-[var(--mag-green)] text-[var(--mag-green)]" />
        <h1 className="text-2xl font-bold text-[var(--mag-ink)]">New password</h1>
        <p className="mt-1 text-sm text-[var(--mag-ink-soft)]">Create a new password for <strong className="text-[var(--mag-ink)]">{email}</strong>.</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mag-ink-muted)]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
              minLength={8}
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

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mag-ink-muted)]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              required
              minLength={8}
              className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
            />
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
                Reset password
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  )
}
