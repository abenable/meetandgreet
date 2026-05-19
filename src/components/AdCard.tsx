import { useQuery } from "@tanstack/react-query"
import { Film, Crown, X } from "lucide-react"
import { getAdConfig } from "../server/ads"
import { Link } from "@tanstack/react-router"

interface AdCardProps {
  onClose?: () => void
}

export function AdCard({ onClose }: AdCardProps) {
  const { data: config } = useQuery({
    queryKey: ["ad-config"],
    queryFn: () => getAdConfig(),
  })

  if (!config?.showAds) return null

  return (
    <section className="relative h-full w-full shrink-0 snap-start snap-stop overflow-hidden bg-[var(--mag-bg)]">
      <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--mag-surface)]">
          <Film className="h-8 w-8 text-[var(--mag-ink-muted)]" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--mag-ink-muted)]">Sponsored</p>
        <h3 className="mt-2 text-xl font-bold text-[var(--mag-ink)]">Upgrade to Pro</h3>
        <p className="mt-2 max-w-xs text-sm text-[var(--mag-ink-soft)]">
          Remove all ads, get unlimited swipes, and unlock every feature.
        </p>

        <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--mag-ink)] py-3 text-sm font-bold !text-[var(--mag-bg)] no-underline transition hover:opacity-80"
          >
            <Crown className="h-4 w-4" />
            See Plans
          </Link>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-3 text-sm font-medium text-[var(--mag-ink-soft)] transition hover:bg-[var(--mag-surface)]"
          >
            <X className="h-4 w-4" />
            Skip Ad
          </button>
        </div>

        <p className="mt-6 text-[10px] text-[var(--mag-ink-muted)]">
          Ads help keep Meet & Greet free.
        </p>
      </div>
    </section>
  )
}
