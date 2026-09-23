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
  }
}

export function markOtpSent(email: string) {
  if (typeof window === 'undefined' || !email) return
  writeSentAt(email, Date.now())
}

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
