import { createFileRoute, Link } from '@tanstack/react-router'
import { FileText, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/terms')({ component: TermsPage })

function TermsPage() {
  return (
    <main className="page-wrap mx-auto min-h-[80vh] max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mag-surface)] text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-line)] no-underline">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[var(--mag-ink)]" />
          <h1 className="text-lg font-bold text-[var(--mag-ink)]">Terms of Service</h1>
        </div>
      </div>

      <p className="mb-6 text-xs text-[var(--mag-ink-muted)]">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="space-y-6 text-sm leading-relaxed text-[var(--mag-ink-soft)]">
        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Meet & Greet, you agree to be bound by these Terms of Service and our Privacy Policy.
            If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">2. Eligibility</h2>
          <p>
            You must be at least 18 years old to use Meet & Greet. By using our service, you represent and warrant that
            you meet this age requirement and have the legal capacity to enter into these terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">3. User Accounts</h2>
          <p className="mb-2">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Provide accurate and truthful information during registration</li>
            <li>Keep your account information up to date</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Not share your account credentials with anyone</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">4. Acceptable Use</h2>
          <p className="mb-2">You agree not to use Meet & Greet to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Harass, abuse, or threaten other users</li>
            <li>Post or share content that is hateful, discriminatory, or offensive</li>
            <li>Impersonate any person or entity</li>
            <li>Share sexually explicit or obscene content</li>
            <li>Scam, defraud, or deceive other users</li>
            <li>Collect personal information about other users without their consent</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">5. Content and Conduct</h2>
          <p>
            You retain ownership of the content you post on Meet & Greet. By posting content, you grant us a non-exclusive,
            royalty-free license to use, display, and distribute your content solely for the purpose of operating and
            improving our service. We reserve the right to remove any content that violates these terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">6. Safety and Reporting</h2>
          <p>
            Your safety is important to us. If you encounter inappropriate behavior or content, please report it immediately
            through the in-app reporting features. We will review reports and take appropriate action, which may include
            account suspension or termination.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">7. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at any time for violations of these terms or for
            any other reason at our sole discretion. You may also delete your account at any time through your profile settings.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">8. Disclaimers</h2>
          <p>
            Meet & Greet is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We do not guarantee
            that our service will be uninterrupted, secure, or error-free. We are not responsible for the conduct of other
            users or for any interactions that occur outside of our platform.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">9. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Meet & Greet Inc. shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages arising out of or relating to your use of our service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">10. Changes to These Terms</h2>
          <p>
            We may update these Terms of Service from time to time. We will notify you of significant changes by posting
            the updated terms on this page with a revised date. Your continued use of Meet & Greet after changes are posted
            constitutes your acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[var(--mag-ink)]">11. Contact Us</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:hello@meetandgreet.app" className="text-[var(--mag-ink)] underline">hello@meetandgreet.app</a>.
          </p>
        </section>
      </div>
    </main>
  )
}
