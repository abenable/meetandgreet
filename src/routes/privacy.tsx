import { createFileRoute, Link } from '@tanstack/react-router'
import { Shield, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/privacy')({ component: PrivacyPage })

function PrivacyPage() {
  return (
    <main className="page-wrap mx-auto min-h-[80vh] max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-surface)] text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-line)] no-underline">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[var(--mag-ink)]" />
          <h1 className="text-lg font-bold text-[var(--mag-ink)]">Privacy Policy</h1>
        </div>
      </div>

      <p className="mb-6 text-xs text-[var(--mag-ink-muted)]">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="space-y-6 text-sm leading-relaxed text-[var(--mag-ink-soft)]">
        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">1. Introduction</h2>
          <p>
            Meet & Greet Inc. (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, store, and protect your personal information when you use
            the Meet & Greet application and related services.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">2. Information We Collect</h2>
          <p className="mb-2">We collect the following types of information:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-[var(--mag-ink)]">Account Information:</strong> Your name, email address, phone number,
              and password when you create an account.
            </li>
            <li>
              <strong className="text-[var(--mag-ink)]">Profile Information:</strong> Photos, bio, location, interests,
              job title, and other details you choose to share on your profile.
            </li>
            <li>
              <strong className="text-[var(--mag-ink)]">Usage Data:</strong> Information about how you interact with our
              service, including swipes, matches, messages, and event check-ins.
            </li>
            <li>
              <strong className="text-[var(--mag-ink)]">Device Information:</strong> IP address, browser type, operating
              system, and device identifiers.
            </li>
            <li>
              <strong className="text-[var(--mag-ink)]">Location Data:</strong> Approximate location based on your IP address
              or precise location if you grant permission.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">3. How We Use Your Information</h2>
          <p className="mb-2">We use your information to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Provide, maintain, and improve the Meet & Greet service</li>
            <li>Create and manage your account</li>
            <li>Facilitate matches and communication between users</li>
            <li>Personalize your experience and suggest relevant events or profiles</li>
            <li>Ensure safety and security by detecting and preventing fraud or abuse</li>
            <li>Communicate with you about updates, security alerts, and support messages</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">4. Information Sharing</h2>
          <p className="mb-2">
            We do not sell your personal information. We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-[var(--mag-ink)]">With Other Users:</strong> Your profile information is visible
              to other users as part of the matching experience.
            </li>
            <li>
              <strong className="text-[var(--mag-ink)]">Service Providers:</strong> We may share information with trusted
              third-party vendors who help us operate our service (e.g., hosting, analytics).
            </li>
            <li>
              <strong className="text-[var(--mag-ink)]">Legal Requirements:</strong> We may disclose information if
              required by law, subpoena, or to protect our rights and safety.
            </li>
            <li>
              <strong className="text-[var(--mag-ink)]">Business Transfers:</strong> In the event of a merger,
              acquisition, or sale of assets, your information may be transferred as part of that transaction.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">5. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide you with
            our services. If you delete your account, we will delete or anonymize your personal information within a
            reasonable timeframe, except where we are legally required to retain it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">6. Security</h2>
          <p>
            We implement reasonable technical and organizational measures to protect your personal information against
            unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the
            internet or electronic storage is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">7. Your Rights and Choices</h2>
          <p className="mb-2">Depending on your location, you may have the following rights:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Access, update, or delete your personal information</li>
            <li>Export your data in a portable format</li>
            <li>Restrict or object to certain processing activities</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p className="mt-2">
            You can exercise many of these rights directly within the app through your profile and settings. For other
            requests, contact us at{' '}
            <a href="mailto:privacy@meetandgreet.app" className="text-[var(--mag-ink)] underline">privacy@meetandgreet.app</a>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">8. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to enhance your experience, analyze usage, and support authentication.
            You can control cookies through your browser settings. Disabling cookies may affect the functionality of our service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">9. Third-Party Links</h2>
          <p>
            Our service may contain links to third-party websites or services. We are not responsible for the privacy
            practices or content of those third parties. We encourage you to review their privacy policies before providing
            any personal information.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">10. Children&apos;s Privacy</h2>
          <p>
            Meet & Greet is not intended for users under the age of 18. We do not knowingly collect personal information
            from children under 18. If we become aware that we have collected information from a child under 18, we will
            take steps to delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by posting
            the updated policy on this page with a revised date. Your continued use of Meet & Greet after changes are posted
            constitutes your acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">12. Contact Us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at{' '}
            <a href="mailto:privacy@meetandgreet.app" className="text-[var(--mag-ink)] underline">privacy@meetandgreet.app</a>.
          </p>
        </section>
      </div>
    </main>
  )
}
