import { useRouterState, Link } from '@tanstack/react-router'

export default function Footer() {
  const router = useRouterState()
  const path = router.location.pathname

  const mainPaths = ['/discover', '/events', '/likes', '/matches', '/profile']
  const isMainScreen = mainPaths.some((p) => path === p || path.startsWith(p + '/'))

  return (
    <footer className={`${isMainScreen ? 'pb-24' : 'pb-8'} pt-8 text-[var(--mag-ink-muted)]`}>
      <div className="page-wrap flex flex-col items-center gap-2 text-center text-xs">
        <p className="m-0">Meet & Greet — Making connections that matter.</p>
        <div className="flex items-center gap-3">
          <Link to="/terms" className="text-[var(--mag-ink-muted)] no-underline transition hover:text-[var(--mag-ink-soft)]">Terms</Link>
          <span className="text-[var(--mag-line)]">|</span>
          <Link to="/privacy" className="text-[var(--mag-ink-muted)] no-underline transition hover:text-[var(--mag-ink-soft)]">Privacy</Link>
        </div>
        <p className="m-0 mb-2">&copy; 2026 Meet & Greet Inc. All rights reserved.</p>
      </div>
    </footer>
  )
}
