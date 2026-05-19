import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Film } from "lucide-react"
import { watchRewardedAd } from "../server/ads"

export function RewardedAdButton({
  type,
  eventId,
  onReward,
  children,
  disabled = false,
}: {
  type: "rewarded_boost" | "rewarded_swipes"
  eventId?: string
  onReward?: (reward: string) => void
  children: React.ReactNode
  disabled?: boolean
}) {
  const [isWatching, setIsWatching] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => watchRewardedAd({ data: { type, eventId } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ad-status"] })
      queryClient.invalidateQueries({ queryKey: ["boost-status"] })
      queryClient.invalidateQueries({ queryKey: ["swipe-limit"] })
      onReward?.(data.reward)
    },
  })

  const handleClick = async () => {
    setIsWatching(true)
    await new Promise((r) => setTimeout(r, 3000))
    mutation.mutate()
    setIsWatching(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isWatching || mutation.isPending}
      className="inline-flex items-center gap-2 rounded-full bg-[var(--mag-surface)] border border-[var(--mag-line)] px-4 py-2 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-line)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Film className="h-4 w-4" />
      {isWatching || mutation.isPending ? "Watching ad..." : children}
    </button>
  )
}
