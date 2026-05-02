import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Mail, ArrowRight } from 'lucide-react'
import { sendPasswordResetOtp } from '#/server/auth'
import Logo from '#/components/Logo'

export const Route = createFileRoute('/forgot-password/')({ component: ForgotPasswordPage })

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const sendPasswordResetOtpFn = useServerFn(sendPasswordResetOtp)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const normalizedEmail = email.toLowerCase().trim()

    try {
      await sendPasswordResetOtpFn({ data: normalizedEmail })
      setEmail(normalizedEmail)
      setSent(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="page-wrap flex min-h-[90vh] flex-col items-center justify-center px-4 py-8 text-center">
        <Logo className="mx-auto mb-4 h-20 w-auto" />
        <h1 className="text-2xl font-bold text-[var(--mag-ink)]">Check your email</h1>
        <p className="mt-2 max-w-xs text-sm text-[var(--mag-ink-soft)]">
          We sent a 6-digit code to <strong className="text-[var(--mag-ink)]">{email}</strong>.
        </p>
        <button
          onClick={() => navigate({ to: '/forgot-password/verify', search: { email } })}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--mag-green)] px-6 py-3 text-sm font-bold text-white no-underline transition hover:bg-[var(--mag-green-dark)]"
        >
          Enter code <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="page-wrap flex min-h-[90vh] flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 text-center">
        <Logo className="mx-auto mb-4 h-20 w-auto" />
        <h1 className="text-2xl font-bold text-[var(--mag-ink)]">Forgot password?</h1>
        <p className="mt-1 text-sm text-[var(--mag-ink-soft)]">Enter your email and we will send you a reset code.</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mag-ink-muted)]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
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
                Send code
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
