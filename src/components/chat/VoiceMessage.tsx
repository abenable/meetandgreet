import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '#/lib/cn'
import { formatDuration } from './time'
import { useAudioPeaks } from './useAudioPeaks'

const SPEEDS = [1, 1.5, 2] as const

export function VoiceMessage({
  url,
  isMine,
  played,
  onPlayed,
}: {
  url: string
  isMine: boolean
  played?: boolean
  onPlayed?: () => void
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [speedIndex, setSpeedIndex] = useState(0)
  const peaks = useAudioPeaks(url)

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.src = url
    audioRef.current = audio
    const onMeta = () => setDuration(audio.duration)
    const onEnd = () => {
      setPlaying(false)
      setCurrentTime(0)
    }
    const onTime = () => setCurrentTime(audio.currentTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('timeupdate', onTime)
    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('timeupdate', onTime)
      audio.src = ''
      audioRef.current = null
    }
  }, [url])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    audio.playbackRate = SPEEDS[speedIndex]
    void audio.play()
    setPlaying(true)
    onPlayed?.()
  }

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length
    setSpeedIndex(next)
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next]
  }

  const seekTo = (clientX: number) => {
    const track = trackRef.current
    const audio = audioRef.current
    if (!track || !audio || !Number.isFinite(duration) || duration <= 0) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    audio.currentTime = ratio * duration
    setCurrentTime(audio.currentTime)
  }

  const progress = duration > 0 ? currentTime / duration : 0
  const elapsed = playing || currentTime > 0 ? currentTime : duration

  return (
    <div
      className={cn(
        'flex w-60 max-w-full items-center gap-3 rounded-[22px] px-3 py-2.5',
        isMine ? 'rounded-br-md bg-ink text-on-ink' : 'rounded-bl-md bg-canvas-raised text-ink shadow-sm',
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition',
          isMine ? 'bg-white/20 hover:bg-white/30' : 'bg-canvas-soft hover:bg-hairline',
        )}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>

      <div className="min-w-0 flex-1">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            seekTo(e.clientX)
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) seekTo(e.clientX)
          }}
          onKeyDown={(e) => {
            const audio = audioRef.current
            if (!audio) return
            if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.currentTime + 5, duration)
            if (e.key === 'ArrowLeft') audio.currentTime = Math.max(audio.currentTime - 5, 0)
          }}
          className="flex h-8 cursor-pointer touch-none items-center gap-[2px]"
        >
          {peaks ? (
            peaks.map((peak, i) => {
              const filled = i / peaks.length <= progress
              return (
                <span
                  key={i}
                  style={{ height: `${Math.round(peak * 100)}%` }}
                  className={cn(
                    'w-[2px] flex-1 rounded-full transition-colors',
                    isMine
                      ? filled
                        ? 'bg-on-ink'
                        : 'bg-on-ink/35'
                      : filled
                        ? 'bg-ink'
                        : 'bg-hairline',
                  )}
                />
              )
            })
          ) : (
            <span
              className={cn(
                'h-1 w-full overflow-hidden rounded-full',
                isMine ? 'bg-on-ink/30' : 'bg-hairline',
              )}
            >
              <span
                style={{ width: `${progress * 100}%` }}
                className={cn('block h-full rounded-full', isMine ? 'bg-on-ink' : 'bg-ink')}
              />
            </span>
          )}
        </div>

        <div className="mt-0.5 flex items-center justify-between">
          <span className={cn('text-caption tabular-nums', isMine ? 'text-on-ink/70' : 'text-ink-muted')}>
            {formatDuration(elapsed)}
          </span>
          <div className="flex items-center gap-1.5">
            {played === false && !isMine && (
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="Not played yet" />
            )}
            <button
              type="button"
              onClick={cycleSpeed}
              aria-label={`Playback speed ${SPEEDS[speedIndex]} times`}
              className={cn(
                'rounded-full px-1.5 text-caption tabular-nums transition',
                isMine ? 'text-on-ink/70 hover:text-on-ink' : 'text-ink-muted hover:text-ink',
              )}
            >
              {SPEEDS[speedIndex]}×
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
