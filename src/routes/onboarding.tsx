import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Camera, ChevronRight, User, Calendar, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/onboarding')({ component: OnboardingPage })

function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')

  const totalSteps = 3

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  return (
    <div className="page-wrap flex min-h-[90vh] flex-col px-4 py-4">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--mag-ink-muted)]">
          Step {step} of {totalSteps}
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i + 1 <= step ? 'w-6 bg-[var(--mag-ink)]' : 'w-1.5 bg-[var(--mag-line)]'
              }`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="rise-in flex flex-1 flex-col">
          <h1 className="mb-2 text-2xl font-bold text-[var(--mag-ink)]">Add your photos</h1>
          <p className="mb-6 text-sm text-[var(--mag-ink-soft)]">
            Profiles with photos get 10x more matches.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                className="flex aspect-[3/4] items-center justify-center rounded-xl border-2 border-dashed border-[var(--mag-line)] bg-[var(--mag-surface)] transition hover:border-[var(--mag-ink)] hover:bg-[var(--mag-surface)]"
              >
                <Camera className="h-6 w-6 text-[var(--mag-ink-muted)]" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-xs flex-1 flex-col">
        {step === 2 && (
          <div className="rise-in flex flex-1 flex-col">
            <h1 className="mb-2 text-2xl font-bold text-[var(--mag-ink)]">About you</h1>
            <p className="mb-6 text-sm text-[var(--mag-ink-soft)]">
              Tell us a little about yourself.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink-soft)]">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mag-ink-muted)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your first name"
                    className="w-full rounded-2xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:border-[var(--mag-ink)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink-soft)]">
                  Birthday
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mag-ink-muted)]" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--mag-line)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-ink)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--mag-ink-soft)]">
                  Gender
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Male', 'Female'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                        gender === g
                          ? 'bg-[var(--mag-ink)] text-[var(--mag-bg)]'
                          : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink)] hover:bg-[var(--mag-surface)]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rise-in flex flex-1 flex-col">
            <h1 className="mb-2 text-2xl font-bold text-[var(--mag-ink)]">Your interests</h1>
            <p className="mb-6 text-sm text-[var(--mag-ink-soft)]">
              Pick up to 5 interests to show on your profile.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'Coffee', 'Hiking', 'Indie Music', 'Cooking', 'Yoga', 'Photography',
                'Travel', 'Gaming', 'Fitness', 'Art', 'Reading', 'Dance',
                'Climbing', 'Board Games', 'Dogs', 'Cats', 'Wine', 'Beer',
                'Movies', 'Theater', 'Sports', 'Writing', 'Design', 'Startups',
              ].map((interest) => (
                <button
                  key={interest}
                  className="rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-3 py-1.5 text-xs font-medium text-[var(--mag-ink)] transition hover:border-[var(--mag-ink)]"
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] px-8 py-3 text-sm font-semibold text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
            >
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--mag-ink)] px-8 py-3 text-sm font-semibold text-[var(--mag-bg)] transition hover:opacity-80 active:scale-95"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to="/discover"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--mag-ink)] px-8 py-3 text-sm font-semibold text-[var(--mag-bg)] transition hover:opacity-80 active:scale-95 no-underline"
            >
              <Sparkles className="h-4 w-4" />
              Start Swiping
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
