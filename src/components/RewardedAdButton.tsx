import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Film } from "lucide-react"
import { watchRewardedAd, getAdStatus } from "../server/ads"

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
    mutationFn: () => watchRewardedAd({ type, eventId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ad-status"] })
      queryClient.invalidateQueries({ queryKey: ["boost-status"] })
      queryClient.invalidateQueries({ queryKey: ["swipe-limit"] })
      onReward?.(data.reward)
    },
  })

  const handleClick = async () => {
    setIsWatching(true)
    // Simulate ad watch duration (3 seconds)
    await new Promise((r) => setTimeout(r, 3000))
    mutation.mutate()
    setIsWatching(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isWatching || mutation.isPending}
      className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Film className="h-4 w-4" />
      {isWatching || mutation.isPending ? "Watching ad..." : children}
    </button>
  )
}
