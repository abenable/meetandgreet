import nodemailer from 'nodemailer'
import { MailtrapTransport } from 'mailtrap'

const TOKEN = process.env.MAILTRAP_TOKEN

export function getMailTransport() {
  if (!TOKEN) {
    console.warn('[EMAIL] MAILTRAP_TOKEN not set — emails will be logged to console only')
    return null
  }

  return nodemailer.createTransport(
    MailtrapTransport({
      token: TOKEN,
    })
  )
}

export const sender = {
  address: 'hello@byte10x.dev',
  name: 'Meet & Greet',
}

interface SendOtpEmailOptions {
  to: string
  otp: string
  purpose: 'email-verify' | 'password-reset'
}

export async function sendOtpEmail({ to, otp, purpose }: SendOtpEmailOptions) {
  const transport = getMailTransport()

  const subject =
    purpose === 'email-verify'
      ? 'Verify your email — Meet & Greet'
      : 'Reset your password — Meet & Greet'

  const heading =
    purpose === 'email-verify'
      ? 'Verify your email'
      : 'Reset your password'

  const bodyText =
    purpose === 'email-verify'
      ? 'Use the code below to verify your email address and complete your registration.'
      : 'Use the code below to reset your password. This code will expire in 10 minutes.'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background: #f6f6f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: #10b981; padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
    .content { padding: 32px 24px; }
    .content p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
    .otp-box { background: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace; font-size: 32px; font-weight: 700; color: #111827; letter-spacing: 0.15em; }
    .footer { padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${heading}</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>${bodyText}</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <p style="font-size:13px;color:#6b7280;">If you didn’t request this, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>Meet & Greet &mdash; Byte10x</p>
    </div>
  </div>
</body>
</html>`

  if (transport) {
    await transport.sendMail({
      from: sender,
      to: [to],
      subject,
      html,
      text: `${heading}\n\n${bodyText}\n\nYour code: ${otp}\n\nIf you didn't request this, you can safely ignore this email.`,
    })
    console.log(`[EMAIL] OTP email sent to ${to} via Mailtrap`)
  } else {
    console.log(`[DEV] ${purpose} OTP for ${to}: ${otp}`)
  }
}
