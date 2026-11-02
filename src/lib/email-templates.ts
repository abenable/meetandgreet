// Email HTML templates built on Postmark's open-source transactional email templates
// (https://postmarkapp.com/transactional-email-templates — free to use, tested across Gmail,
// Outlook, Apple Mail, Yahoo and mobile clients, with dark-mode support). Client-safe: no
// server-only imports here so UI code can preview or link these templates.

const brand = {
  name: 'Meet & Greet',
  url: 'https://meetandgreet.tech',
  accent: '#10b981',
  logoUrl: 'https://meetandgreet.tech/logo.png',
  footer: "Meet & Greet",
}

// Postmark base stylesheet, accent-coloured per brand at render time.
const BASE_STYLE = `
/* Base ------------------------------ */

@import url("https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap");
body {
  width: 100% !important;
  height: 100%;
  margin: 0;
  -webkit-text-size-adjust: none;
}

a {
  color: #3869D4;
}

a img {
  border: none;
}

td {
  word-break: break-word;
}

.preheader {
  display: none !important;
  visibility: hidden;
  mso-hide: all;
  font-size: 1px;
  line-height: 1px;
  max-height: 0;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
}
/* Type ------------------------------ */

body,
td,
th {
  font-family: "Nunito Sans", Helvetica, Arial, sans-serif;
}

h1 {
  margin-top: 0;
  color: #333333;
  font-size: 22px;
  font-weight: bold;
  text-align: left;
}

h2 {
  margin-top: 0;
  color: #333333;
  font-size: 16px;
  font-weight: bold;
  text-align: left;
}

h3 {
  margin-top: 0;
  color: #333333;
  font-size: 14px;
  font-weight: bold;
  text-align: left;
}

td,
th {
  font-size: 16px;
}

p,
ul,
ol,
blockquote {
  margin: .4em 0 1.1875em;
  font-size: 16px;
  line-height: 1.625;
}

p.sub {
  font-size: 13px;
}
/* Utilities ------------------------------ */

.align-right {
  text-align: right;
}

.align-left {
  text-align: left;
}

.align-center {
  text-align: center;
}

.u-margin-bottom-none {
  margin-bottom: 0;
}
/* Buttons ------------------------------ */

.button {
  background-color: #3869D4;
  border-top: 10px solid #3869D4;
  border-right: 18px solid #3869D4;
  border-bottom: 10px solid #3869D4;
  border-left: 18px solid #3869D4;
  display: inline-block;
  color: #FFF;
  text-decoration: none;
  border-radius: 3px;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.16);
  -webkit-text-size-adjust: none;
  box-sizing: border-box;
}

.button--green {
  background-color: #22BC66;
  border-top: 10px solid #22BC66;
  border-right: 18px solid #22BC66;
  border-bottom: 10px solid #22BC66;
  border-left: 18px solid #22BC66;
}

.button--red {
  background-color: #FF6136;
  border-top: 10px solid #FF6136;
  border-right: 18px solid #FF6136;
  border-bottom: 10px solid #FF6136;
  border-left: 18px solid #FF6136;
}

@media only screen and (max-width: 500px) {
  .button {
    width: 100% !important;
    text-align: center !important;
  }
}
/* Attribute list ------------------------------ */

.attributes {
  margin: 0 0 21px;
}

.attributes_content {
  background-color: #F4F4F7;
  padding: 16px;
}

.attributes_item {
  padding: 0;
}
/* Related Items ------------------------------ */

.related {
  width: 100%;
  margin: 0;
  padding: 25px 0 0 0;
  -premailer-width: 100%;
  -premailer-cellpadding: 0;
  -premailer-cellspacing: 0;
}

.related_item {
  padding: 10px 0;
  color: #CBCCCF;
  font-size: 15px;
  line-height: 18px;
}

.related_item-title {
  display: block;
  margin: .5em 0 0;
}

.related_item-thumb {
  display: block;
  padding-bottom: 10px;
}

.related_heading {
  border-top: 1px solid #CBCCCF;
  text-align: center;
  padding: 25px 0 10px;
}
/* Discount Code ------------------------------ */

.discount {
  width: 100%;
  margin: 0;
  padding: 24px;
  -premailer-width: 100%;
  -premailer-cellpadding: 0;
  -premailer-cellspacing: 0;
  background-color: #F4F4F7;
  border: 2px dashed #CBCCCF;
}

.discount_heading {
  text-align: center;
}

.discount_body {
  text-align: center;
  font-size: 15px;
}
/* Social Icons ------------------------------ */

.social {
  width: auto;
}

.social td {
  padding: 0;
  width: auto;
}

.social_icon {
  height: 20px;
  margin: 0 8px 10px 8px;
  padding: 0;
}
/* Data table ------------------------------ */

.purchase {
  width: 100%;
  margin: 0;
  padding: 35px 0;
  -premailer-width: 100%;
  -premailer-cellpadding: 0;
  -premailer-cellspacing: 0;
}

.purchase_content {
  width: 100%;
  margin: 0;
  padding: 25px 0 0 0;
  -premailer-width: 100%;
  -premailer-cellpadding: 0;
  -premailer-cellspacing: 0;
}

.purchase_item {
  padding: 10px 0;
  color: #51545E;
  font-size: 15px;
  line-height: 18px;
}

.purchase_heading {
  padding-bottom: 8px;
  border-bottom: 1px solid #EAEAEC;
}

.purchase_heading p {
  margin: 0;
  color: #85878E;
  font-size: 12px;
}

.purchase_footer {
  padding-top: 15px;
  border-top: 1px solid #EAEAEC;
}

.purchase_total {
  margin: 0;
  text-align: right;
  font-weight: bold;
  color: #333333;
}

.purchase_total--label {
  padding: 0 15px 0 0;
}

body {
  background-color: #F2F4F6;
  color: #51545E;
}

p {
  color: #51545E;
}

.email-wrapper {
  width: 100%;
  margin: 0;
  padding: 0;
  -premailer-width: 100%;
  -premailer-cellpadding: 0;
  -premailer-cellspacing: 0;
  background-color: #F2F4F6;
}

.email-content {
  width: 100%;
  margin: 0;
  padding: 0;
  -premailer-width: 100%;
  -premailer-cellpadding: 0;
  -premailer-cellspacing: 0;
}
/* Masthead ----------------------- */

.email-masthead {
  padding: 25px 0;
  text-align: center;
}

.email-masthead_logo {
  width: 94px;
}

.email-masthead_name {
  font-size: 16px;
  font-weight: bold;
  color: #A8AAAF;
  text-decoration: none;
  text-shadow: 0 1px 0 white;
}
/* Body ------------------------------ */

.email-body {
  width: 100%;
  margin: 0;
  padding: 0;
  -premailer-width: 100%;
  -premailer-cellpadding: 0;
  -premailer-cellspacing: 0;
}

.email-body_inner {
  width: 570px;
  margin: 0 auto;
  padding: 0;
  -premailer-width: 570px;
  -premailer-cellpadding: 0;
  -premailer-cellspacing: 0;
  background-color: #FFFFFF;
}

.email-footer {
  width: 570px;
  margin: 0 auto;
  padding: 0;
  -premailer-width: 570px;
  -premailer-cellpadding: 0;
  -premailer-cellspacing: 0;
  text-align: center;
}

.email-footer p {
  color: #A8AAAF;
}

.body-action {
  width: 100%;
  margin: 30px auto;
  padding: 0;
  -premailer-width: 100%;
  -premailer-cellpadding: 0;
  -premailer-cellspacing: 0;
  text-align: center;
}

.body-sub {
  margin-top: 25px;
  padding-top: 25px;
  border-top: 1px solid #EAEAEC;
}

.content-cell {
  padding: 45px;
}
/*Media Queries ------------------------------ */

@media only screen and (max-width: 600px) {
  .email-body_inner,
  .email-footer {
    width: 100% !important;
  }
}

@media (prefers-color-scheme: dark) {
  body,
  .email-body,
  .email-body_inner,
  .email-content,
  .email-wrapper,
  .email-masthead,
  .email-footer {
    background-color: #333333 !important;
    color: #FFF !important;
  }
  p,
  ul,
  ol,
  blockquote,
  h1,
  h2,
  h3,
  span,
  .purchase_item {
    color: #FFF !important;
  }
  .attributes_content,
  .discount {
    background-color: #222 !important;
  }
  .email-masthead_name {
    text-shadow: none !important;
  }
}

:root {
  color-scheme: light dark;
  supported-color-schemes: light dark;
}
</style>
<style type="text/css">
  .f-fallback  {
    font-family: Arial, sans-serif;
  }
`

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Wrap content in the tested Postmark layout (masthead, body card, footer). */
function layout(preheader: string, contentHtml: string): string {
  const style = BASE_STYLE.replaceAll('#3869D4', brand.accent)
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${escapeHtml(preheader)}</title>
    <style type="text/css" rel="stylesheet" media="all">
${style}
    </style>
    <!--[if mso]>
    <style type="text/css">
      .f-fallback  {
        font-family: Arial, sans-serif;
      }
    </style>
  <![endif]-->
  </head>
  <body>
    <span class="preheader">${escapeHtml(preheader)}</span>
    <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table class="email-content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td class="email-masthead">
                <a href="${brand.url}" class="f-fallback email-masthead_logo">
                  <img src="${brand.logoUrl}" width="94" height="94" alt="${escapeHtml(brand.name)} logo" style="width: 100%; max-width: 94px; height: auto; display: block; margin: 0 auto;" />
                </a>
              </td>
            </tr>
            <tr>
              <td class="email-body" width="570" cellpadding="0" cellspacing="0">
                <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="content-cell">
                      <div class="f-fallback">
${contentHtml}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table class="email-footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="content-cell" align="center">
                      <p class="f-fallback sub align-center">${escapeHtml(brand.footer)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export interface EmailContent {
  subject: string
  html: string
  text: string
}

const OTP_BOX = (code: string) => `
                        <!-- One-time code: Postmark .discount block, dashed border, centred -->
                        <table class="discount" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <td class="discount_heading">
                              <span style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace;font-size:32px;font-weight:bold;letter-spacing:0.15em;color:#333333;">${escapeHtml(code)}</span>
                            </td>
                          </tr>
                        </table>`

/**
 * OTP email for signup verification and password reset, following Postmark's
 * password-reset best practices: state what it is for, how long the code is valid,
 * and a reassuring line for people who didn't request it.
 */
export function otpEmail({ purpose, otp }: { purpose: 'email-verify' | 'password-reset'; otp: string }): EmailContent {
  const verify = purpose === 'email-verify'
  const subject = verify ? 'Verify your email — Meet & Greet' : 'Reset your password — Meet & Greet'
  const preheader = 'Your code expires in 10 minutes.'
  const text = [
    verify ? 'Verify your email' : 'Reset your password',
    '',
    verify
      ? 'Use the code below to verify your email address and complete your registration.'
      : 'Use the code below to reset your password.',
    '',
    'Your code: ' + otp,
    '',
    'The code is only valid for the next 10 minutes.',
    "If you didn't request this, you can safely ignore this email.",
    '',
    '— Meet & Greet',
  ].join('\n')
  const html = layout(
    preheader,
    `<h1>Hi there,</h1>
                        <p>${verify ? 'Use the code below to verify your email address and complete your registration.' : 'Use the code below to reset your password.'} <strong>This code is only valid for the next 10 minutes.</strong></p>
${OTP_BOX(otp)}
                        <p>If you didn't request this, you can safely ignore this email.</p>
                        <p>Thanks,
                          <br>The Meet &amp; Greet team</p>`,
  )
  return { subject, html, text }
}
