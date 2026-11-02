import '@tanstack/react-start/server-only'
import { env } from 'cloudflare:workers'
import { otpEmail } from './email-templates'

// Email is sent through the native Email Sending binding (env.EMAIL) instead of
// a third-party HTTP API. The binding requires no API keys and sends from the
// verified domain meetandgreet.tech. Workers (workerd) cannot use SMTP, so the
// binding (not nodemailer) is the only viable transport here.
// Templates live in ./email-templates (Postmark-derived, client-tested).

export const sender = {
  address: 'no-reply@meetandgreet.tech',
  name: 'Meet & Greet',
}

interface SendOtpEmailOptions {
  to: string
  otp: string
  purpose: 'email-verify' | 'password-reset'
}

export async function sendOtpEmail({ to, otp, purpose }: SendOtpEmailOptions) {
  const { subject, html, text } = otpEmail({ purpose, otp })

  if (!env.EMAIL) {
    console.warn('[EMAIL] EMAIL binding not available — email will be logged to console only')
    console.log(`[DEV] ${purpose} OTP for ${to}: ${otp}`)
    return
  }

  try {
    await env.EMAIL.send({
      to,
      from: { email: sender.address, name: sender.name },
      subject,
      html,
      text,
    })
    console.log(`[EMAIL] OTP email sent to ${to} via Cloudflare Email Sending`)
  } catch (error: any) {
    const code = error?.code ? ` (code: ${error.code})` : ''
    throw new Error(`[EMAIL] Email Sending error${code}: ${error?.message ?? String(error)}`)
  }
}
