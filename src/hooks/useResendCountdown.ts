import { useCallback, useEffect, useState } from 'react'

const WINDOW_SECONDS = 60
const KEY_PREFIX = 'mag-otp-sent:'

function readSentAt(email: string): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(KEY_PREFIX + email)
    const value = raw ? Number(raw) : NaN
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

function writeSentAt(email: string, at: number) {
  try {
    window.sessionStorage.setItem(KEY_PREFIX + email, String(at))
  } catch {
    // Private mode or blocked storage: the countdown just restarts.
  }
}

/**
 * Record that a code was just issued for this address, from outside the screen
 * that shows the countdown — the request step sends the code, the next screen
 * counts down against it.
 */
export function markOtpSent(email: string) {
  if (typeof window === 'undefined' || !email) return
  writeSentAt(email, Date.now())
}

/**
 * Seconds left before a new code may be requested.
 *
 * Anchored to the moment the code was actually sent rather than to component
 * mount. The old screens reset a 60-second block on every mount without
 * sending anything, so navigating away and back locked the resend button for
 * another minute for no reason.
 */
export function useResendCountdown(email: string) {
  const [remaining, setRemaining] = useState(0)

  const recompute = useCallback(() => {
    if (!email) return 0
    const sentAt = readSentAt(email)
    if (sentAt === null) return 0
    const elapsed = Math.floor((Date.now() - sentAt) / 1000)
    return Math.max(0, WINDOW_SECONDS - elapsed)
  }, [email])

  useEffect(() => {
    if (!email) return
    // First arrival on the screen means a code was just issued for us.
    if (readSentAt(email) === null) writeSentAt(email, Date.now())
    setRemaining(recompute())
    const timer = setInterval(() => setRemaining(recompute()), 1000)
    return () => clearInterval(timer)
  }, [email, recompute])

  const markSent = useCallback(() => {
    if (!email) return
    writeSentAt(email, Date.now())
    setRemaining(WINDOW_SECONDS)
  }, [email])

  return { remaining, markSent }
}
