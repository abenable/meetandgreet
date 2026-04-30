import { useRouterState } from '@tanstack/react-router'

export default function Footer() {
  const router = useRouterState()
  const path = router.location.pathname

  const mainPaths = ['/discover', '/events', '/likes', '/matches', '/profile']
  const isMainScreen = mainPaths.some((p) => path === p || path.startsWith(p + '/'))

  return (
    <footer className={`${isMainScreen ? 'pb-24' : 'pb-8'} pt-8 text-[var(--mag-ink-muted)]`}>
      <div className="page-wrap flex flex-col items-center gap-2 text-center text-xs">
        <p className="m-0">Meet & Greet — Making connections that matter.</p>
        <p className="m-0">&copy; {new Date().getFullYear()} Meet & Greet Inc. All rights reserved.</p>
      </div>
    </footer>
  )
}
