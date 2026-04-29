import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Heart, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      window.location.href = '/discover'
    }, 1200)
  }

  return (
    <main className="page-wrap flex min-h-[90vh] flex-col px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--mag-green)] shadow-lg">
          <Heart className="h-8 w-8 fill-white text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--mag-ink)]">
          {mode === 'login' ? 'Welcome Back' : 'Join Meet & Greet'}
        </h1>
        <p className="mt-1 text-sm text-[var(--mag-ink-soft)]">
          {mode === 'login' ? 'Log in to continue swiping' : 'Create your account to start matching'}
        </p>
      </div>

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
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mag-ink-muted)]" />
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
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mag-ink-muted)]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {mode === 'login' && (
          <Link to="/" className="text-right text-xs text-[var(--mag-green)] no-underline">
            Trouble logging in?
          </Link>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[var(--mag-green)] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--mag-green-dark)] disabled:opacity-60"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              {mode === 'login' ? 'Log In' : 'Create Account'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--mag-line)]" />
        <span className="text-xs text-[var(--mag-ink-muted)]">or</span>
        <div className="h-px flex-1 bg-[var(--mag-line)]" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <button className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-6 py-3 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]">
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
        <button className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-6 py-3 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-1.06 3.76-.91 1.33.11 2.42.63 3.18 1.58-2.71 1.59-2.25 5.98.08 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Continue with Apple
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--mag-ink-muted)]">
        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="font-semibold text-[var(--mag-green)]"
        >
          {mode === 'login' ? 'Sign up' : 'Log in'}
        </button>
      </p>

      <div className="mt-auto flex justify-center gap-4 text-[10px] text-[var(--mag-ink-muted)]">
        <a href="#" className="hover:text-[var(--mag-ink-soft)]">Terms of Service</a>
        <a href="#" className="hover:text-[var(--mag-ink-soft)]">Privacy Policy</a>
        <a href="#" className="hover:text-[var(--mag-ink-soft)]">Cookie Policy</a>
      </div>
    </main>
  )
}
