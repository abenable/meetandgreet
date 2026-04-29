import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, MapPin, Users, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/settings/discovery')({ component: DiscoverySettingsPage })

function DiscoverySettingsPage() {
  const [distance, setDistance] = useState(25)
  const [ageMin, setAgeMin] = useState(21)
  const [ageMax, setAgeMax] = useState(35)
  const [showMe, setShowMe] = useState('Everyone')

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <Link to="/settings" className="rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)] no-underline">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-[var(--mag-ink)]">Discovery Settings</h1>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--mag-ink-soft)]" />
            <h2 className="text-sm font-semibold text-[var(--mag-ink)]">Maximum Distance</h2>
            <span className="ml-auto text-sm font-medium text-[var(--mag-green)]">{distance} mi</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="w-full accent-[var(--mag-green)]"
          />
        </div>

        <div className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--mag-ink-soft)]" />
            <h2 className="text-sm font-semibold text-[var(--mag-ink)]">Age Range</h2>
            <span className="ml-auto text-sm font-medium text-[var(--mag-green)]">{ageMin} - {ageMax}</span>
          </div>
          <div className="flex gap-4">
            <input
              type="range"
              min={18}
              max={80}
              value={ageMin}
              onChange={(e) => setAgeMin(Math.min(Number(e.target.value), ageMax))}
              className="w-full accent-[var(--mag-green)]"
            />
            <input
              type="range"
              min={18}
              max={80}
              value={ageMax}
              onChange={(e) => setAgeMax(Math.max(Number(e.target.value), ageMin))}
              className="w-full accent-[var(--mag-green)]"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[var(--mag-ink-soft)]" />
            <h2 className="text-sm font-semibold text-[var(--mag-ink)]">Show Me</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Women', 'Men', 'Everyone'].map((option) => (
              <button
                key={option}
                onClick={() => setShowMe(option)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  showMe === option
                    ? 'bg-[var(--mag-green)] text-white'
                    : 'border border-[var(--mag-line)] bg-[var(--mag-card)] text-[var(--mag-ink)]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
