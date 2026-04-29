export default function Footer() {
  return (
    <footer className="pb-24 pt-8 text-[var(--mag-ink-muted)]">
      <div className="page-wrap flex flex-col items-center gap-2 text-center text-xs">
        <p className="m-0">Meet & Greet — Making connections that matter.</p>
        <p className="m-0">&copy; {new Date().getFullYear()} Meet & Greet Inc. All rights reserved.</p>
      </div>
    </footer>
  )
}
