import { useEffect, useRef, useState } from 'react'
import { Mic, Send, Trash2 } from 'lucide-react'
import { cn } from '#/lib/cn'
import { formatDuration } from './time'

const MAX_SECONDS = 60
const CANCEL_DISTANCE = 90

export function Composer({
  onSend,
  onSendVoice,
  onTyping,
  allowVoice,
  disabled = false,
  placeholder = 'Message',
}: {
  onSend: (text: string) => void
  onSendVoice?: (blob: Blob, seconds: number) => void
  onTyping?: (typing: boolean) => void
  allowVoice: boolean
  disabled?: boolean
  placeholder?: string
}) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const frameRef = useRef<number | null>(null)
  const startXRef = useRef(0)
  const cancelRef = useRef(false)
  const secondsRef = useRef(0)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }, [text])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      recorderRef.current?.stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const submitText = () => {
    const value = text.trim()
    if (!value || disabled) return
    onSend(value)
    setText('')
    onTyping?.(false)
  }

  const stopTracks = () => {
    recorderRef.current?.stream?.getTracks().forEach((t) => t.stop())
    if (timerRef.current) clearInterval(timerRef.current)
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    timerRef.current = null
    frameRef.current = null
    recorderRef.current = null
  }

  const startRecording = async (clientX: number) => {
    if (!allowVoice || disabled || recording) return
    setError(null)
    startXRef.current = clientX
    cancelRef.current = false
    secondsRef.current = 0
    setSeconds(0)
    setCancelling(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const length = secondsRef.current
        stopTracks()
        setRecording(false)
        setLevel(0)
        setCancelling(false)
        if (!cancelRef.current && blob.size > 0 && length >= 1) {
          onSendVoice?.(blob, length)
        }
      }

      recorder.start()
      recorderRef.current = recorder
      setRecording(true)

      timerRef.current = setInterval(() => {
        secondsRef.current += 1
        setSeconds(secondsRef.current)
        if (secondsRef.current >= MAX_SECONDS && recorder.state === 'recording') recorder.stop()
      }, 1000)

      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctx) {
        const ctx = new Ctx()
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        ctx.createMediaStreamSource(stream).connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)
        const tick = () => {
          analyser.getByteFrequencyData(data)
          const avg = data.reduce((a, b) => a + b, 0) / data.length
          setLevel(Math.min(1, avg / 90))
          frameRef.current = requestAnimationFrame(tick)
        }
        tick()
      }
    } catch {
      setError('Microphone unavailable. Check permissions.')
      setRecording(false)
    }
  }

  const moveRecording = (clientX: number) => {
    if (!recording) return
    const travelled = startXRef.current - clientX
    setCancelling(travelled > CANCEL_DISTANCE)
  }

  const endRecording = (cancel: boolean) => {
    if (!recording) return
    cancelRef.current = cancel
    const recorder = recorderRef.current
    if (recorder && recorder.state === 'recording') recorder.stop()
  }

  const hasText = text.trim().length > 0

  return (
    <div className="pb-safe">
      {error && <p className="mb-1.5 px-1 text-caption text-danger">{error}</p>}

      {recording ? (
        <div className="flex items-center gap-3 rounded-full bg-canvas-raised px-4 py-2.5 shadow-sm">
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-danger" />
          <span className="shrink-0 text-body tabular-nums text-ink">{formatDuration(seconds)}</span>
          <div className="flex h-6 min-w-0 flex-1 items-center gap-[3px] overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                style={{ height: `${20 + Math.sin(i * 0.9 + seconds) * 12 * level + level * 55}%` }}
                className="w-[3px] flex-1 rounded-full bg-ink/40 transition-[height] duration-100"
              />
            ))}
          </div>
          <span
            className={cn(
              'shrink-0 text-body-sm transition',
              cancelling ? 'text-danger' : 'text-ink-muted',
            )}
          >
            {cancelling ? 'Release to cancel' : '‹ slide to cancel'}
          </span>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => {
              setText(e.target.value)
              onTyping?.(e.target.value.length > 0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submitText()
              }
            }}
            className="max-h-[132px] min-h-11 flex-1 resize-none rounded-card bg-field px-4 py-3 text-body text-ink outline-none transition placeholder:text-ink-faint focus:ring-2 focus:ring-ink disabled:opacity-60"
          />

          {hasText || !allowVoice ? (
            <button
              type="button"
              onClick={submitText}
              disabled={disabled || !hasText}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-on-ink shadow-sm transition hover:shadow-md active:scale-95 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Hold to record a voice message"
              disabled={disabled}
              onPointerDown={(e) => {
                e.preventDefault()
                void startRecording(e.clientX)
              }}
              onPointerMove={(e) => moveRecording(e.clientX)}
              onPointerUp={() => endRecording(cancelling)}
              onPointerCancel={() => endRecording(true)}
              onPointerLeave={() => recording && endRecording(cancelling)}
              className="flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded-full bg-canvas-soft text-ink transition hover:bg-hairline active:scale-95 disabled:opacity-40"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {recording && (
        <button
          type="button"
          onClick={() => endRecording(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 text-caption text-ink-muted"
        >
          <Trash2 className="h-3 w-3" /> Cancel
        </button>
      )}
    </div>
  )
}
