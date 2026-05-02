import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { verifyPasswordResetOtp } from '#/server/auth'
import Logo from '#/components/Logo'

export const Route = createFileRoute('/forgot-password/verify')({ component: VerifyOtpPage })

function VerifyOtpPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/forgot-password/verify' })
  const email = (search as any)?.email || ''
  const verifyPasswordResetOtpFn = useServerFn(verifyPasswordResetOtp)

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await verifyPasswordResetOtpFn({ data: { email, otp } })
      if (!res.valid) {
        setError('Invalid or expired code. Please try again.')
        setLoading(false)
        return
      }
      navigate({ to: '/forgot-password/reset', search: { email, otp } })
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <main className="page-wrap flex min-h-[90vh] flex-col items-center justify-center px-4 py-8 text-center">
        <Logo className="mx-auto mb-4 h-20 w-auto" />
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
        <Logo className="mx-auto mb-4 h-20 w-auto" />
        <h1 className="text-2xl font-bold text-[var(--mag-ink)]">Enter code</h1>
        <p className="mt-1 text-sm text-[var(--mag-ink-soft)]">
          We sent a 6-digit code to <strong className="text-[var(--mag-ink)]">{email}</strong>.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            required
            className="w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 px-4 text-center text-lg tracking-[0.5em] text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
          />

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--mag-green)] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--mag-green-dark)] disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Verify
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  )
}
