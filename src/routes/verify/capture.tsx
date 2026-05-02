import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Camera, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/verify/capture')({ component: VerifyCapturePage })

function VerifyCapturePage() {
  const [step, setStep] = useState<'pose' | 'capture' | 'review' | 'success'>('pose')

  return (
    <div className="page-wrap flex min-h-[90vh] flex-col px-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => history.back()} className="rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Photo Verification</h1>
      </div>

      {step === 'pose' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-3xl border-4 border-dashed border-[var(--mag-green)]/30 bg-[var(--mag-surface)] p-12">
            <div className="text-6xl font-bold text-[var(--mag-green)]/20">✌</div>
          </div>
          <h2 className="text-lg font-bold text-[var(--mag-ink)]">Strike a pose</h2>
          <p className="mt-2 max-w-xs text-sm text-[var(--mag-ink-soft)]">
            Hold up two fingers next to your face, like the example above.
          </p>
          <button
            onClick={() => setStep('capture')}
            className="mt-8 rounded-full bg-[var(--mag-green)] px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[var(--mag-green-dark)]"
          >
            I am Ready
          </button>
        </div>
      )}

      {step === 'capture' && (
        <div className="flex flex-1 flex-col items-center">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl bg-gray-900">
            <div className="absolute inset-0 flex items-center justify-center text-white/30">
              <Camera className="h-16 w-16" />
            </div>
            <div className="absolute inset-0 rounded-3xl border-4 border-white/20" />
            <p className="absolute top-6 left-0 right-0 text-center text-sm font-medium text-white">
              Position your face in the frame
            </p>
          </div>
          <button
            onClick={() => setStep('review')}
            className="mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--mag-green)] shadow-lg transition hover:scale-105"
          >
            <Camera className="h-7 w-7 text-white" />
          </button>
        </div>
      )}

      {step === 'review' && (
        <div className="flex flex-1 flex-col items-center">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl bg-[var(--mag-surface)]">
            <div className="shimmer absolute inset-0" />
          </div>
          <p className="mt-4 text-sm text-[var(--mag-ink-soft)]">Analyzing your photo...</p>
          <div className="mt-2 h-1 w-32 overflow-hidden rounded-full bg-[var(--mag-line)]">
            <div className="h-full w-2/3 rounded-full bg-[var(--mag-green)]" />
          </div>
          <button
            onClick={() => setStep('success')}
            className="mt-6 text-xs text-[var(--mag-green)] underline"
          >
            Simulate success
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--mag-green)]/15">
            <CheckCircle className="h-10 w-10 text-[var(--mag-green)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--mag-ink)]">You are Verified!</h2>
          <p className="mt-2 max-w-xs text-sm text-[var(--mag-ink-soft)]">
            Your blue checkmark will appear on your profile within a few minutes.
          </p>
          <a
            href="/profile"
            className="mt-8 rounded-full bg-[var(--mag-green)] px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[var(--mag-green-dark)] no-underline"
          >
            Back to Profile
          </a>
        </div>
      )}
    </div>
  )
}
