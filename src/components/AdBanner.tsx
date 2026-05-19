import { useQuery } from "@tanstack/react-query"
import { getAdConfig } from "../server/ads"

export function AdBanner() {
  const { data: config } = useQuery({
    queryKey: ["ad-config"],
    queryFn: () => getAdConfig(),
  })

  if (!config?.showAds) return null

  return (
    <div className="w-full border border-dashed border-[var(--mag-line)] bg-[var(--mag-surface)] p-4 text-center">
      <p className="text-xs font-medium text-[var(--mag-ink-muted)]">Advertisement</p>
      <div className="mt-2 flex h-24 items-center justify-center">
        <p className="text-sm text-[var(--mag-ink-soft)]">Your ad here</p>
      </div>
      <p className="mt-1 text-[10px] text-[var(--mag-ink-muted)]">
        Remove ads with{" "}
        <a href="/settings" className="underline text-[var(--mag-ink)]">
          Pro
        </a>
      </p>
    </div>
  )
}
