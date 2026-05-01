// Maps raw error messages from Better-Auth / server into user-friendly strings.
export function normalizeAuthError(raw: string): string {
  const msg = (raw || '').toLowerCase()

  if (msg.includes('weak') || msg.includes('too weak') || msg.includes('password is too short')) {
    return 'Password is too weak. Use at least 8 characters with a mix of letters, numbers, and symbols.'
  }
  if (msg.includes('already exists') || msg.includes('user already exist') || msg.includes('email is already')) {
    return 'An account with this email already exists. Try logging in instead.'
  }
  if (msg.includes('invalid email') || msg.includes('invalid credentials') || msg.includes('invalid login')) {
    return 'Invalid email or password.'
  }
  if (msg.includes('not found')) {
    return 'We could not find an account with that email.'
  }
  if (msg.includes('expired')) {
    return 'This code has expired. Please request a new one.'
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('unable to connect')) {
    return 'Network error. Please check your connection and try again.'
  }
  return raw || 'Something went wrong. Please try again.'
}

export const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export function validatePassword(password: string) {
  const requirements = PASSWORD_REQUIREMENTS.map((r) => ({
    label: r.label,
    met: r.test(password),
  }))
  const valid = requirements.every((r) => r.met)
  return { valid, requirements }
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
