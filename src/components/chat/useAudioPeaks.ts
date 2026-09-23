import { useEffect, useState } from 'react'

const cache = new Map<string, number[] | null>()

export function useAudioPeaks(url: string, bars = 42) {
  const [peaks, setPeaks] = useState<number[] | null>(() => cache.get(url) ?? null)

  useEffect(() => {
    if (cache.has(url)) {
      setPeaks(cache.get(url) ?? null)
      return
    }
    let cancelled = false

    const decode = async () => {
      try {
        const response = await fetch(url)
        const buffer = await response.arrayBuffer()
        const Ctx =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctx) throw new Error('no AudioContext')
        const ctx = new Ctx()
        const audio = await ctx.decodeAudioData(buffer)
        const channel = audio.getChannelData(0)
        const block = Math.floor(channel.length / bars)
        const out: number[] = []
        for (let i = 0; i < bars; i++) {
          let sum = 0
          for (let j = 0; j < block; j++) sum += Math.abs(channel[i * block + j] ?? 0)
          out.push(sum / Math.max(block, 1))
        }
        const max = Math.max(...out, 0.0001)
        const normalised = out.map((v) => Math.max(0.12, v / max))
        void ctx.close()
        cache.set(url, normalised)
        if (!cancelled) setPeaks(normalised)
      } catch {
        cache.set(url, null)
        if (!cancelled) setPeaks(null)
      }
    }

    void decode()
    return () => {
      cancelled = true
    }
  }, [url, bars])

  return peaks
}
