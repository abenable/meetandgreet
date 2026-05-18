import { useQuery } from "@tanstack/react-query"
import { getAdConfig } from "../server/ads"

export function AdBanner() {
  const { data: config } = useQuery({
    queryKey: ["ad-config"],
    queryFn: () => getAdConfig(),
  })

  if (!config?.showAds) return null

  return (
    <div className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
      <p className="text-xs font-medium text-slate-500">Advertisement</p>
      <div className="mt-2 flex h-24 items-center justify-center">
        <p className="text-sm text-slate-400">Your ad here</p>
      </div>
      <p className="mt-1 text-[10px] text-slate-400">
        Remove ads with{" "}
        <a href="/settings" className="underline">
          Pro
        </a>
      </p>
    </div>
  )
}
