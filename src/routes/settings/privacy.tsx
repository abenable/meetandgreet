import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Shield, Eye, EyeOff, Lock, Ban, Flag, X } from 'lucide-react'

export const Route = createFileRoute('/settings/privacy')({ component: PrivacySettingsPage })

function PrivacySettingsPage() {
  const [showOnline, setShowOnline] = useState(true)
  const [hideAge, setHideAge] = useState(false)
  const [hideDistance, setHideDistance] = useState(false)
  const [showBlocked, setShowBlocked] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showBlockContacts, setShowBlockContacts] = useState(false)
  const [reportReason, setReportReason] = useState('')

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-5 text-center">
        <Link to="/settings" className="absolute left-4 top-4 rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)] no-underline">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-[var(--mag-ink)]">Privacy &amp; Safety</h1>
      </div>

      <div className="mb-5 overflow-hidden rounded-none border border-[var(--mag-line)] bg-[var(--mag-card)]">
        <div className="flex items-center gap-3 border-b border-[var(--mag-line)] px-4 py-3">
          <Eye className="h-5 w-5 text-[var(--mag-ink-soft)]" />
          <span className="flex-1 text-sm text-[var(--mag-ink)]">Show Online Status</span>
          <button
            onClick={() => setShowOnline(!showOnline)}
            className={`relative h-6 w-11 rounded-full transition ${showOnline ? 'bg-[var(--mag-ink)]' : 'bg-[var(--mag-line)]'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${showOnline ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="flex items-center gap-3 border-b border-[var(--mag-line)] px-4 py-3">
          <EyeOff className="h-5 w-5 text-[var(--mag-ink-soft)]" />
          <span className="flex-1 text-sm text-[var(--mag-ink)]">Hide Age</span>
          <button
            onClick={() => setHideAge(!hideAge)}
            className={`relative h-6 w-11 rounded-full transition ${hideAge ? 'bg-[var(--mag-ink)]' : 'bg-[var(--mag-line)]'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${hideAge ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <EyeOff className="h-5 w-5 text-[var(--mag-ink-soft)]" />
          <span className="flex-1 text-sm text-[var(--mag-ink)]">Hide Distance</span>
          <button
            onClick={() => setHideDistance(!hideDistance)}
            className={`relative h-6 w-11 rounded-full transition ${hideDistance ? 'bg-[var(--mag-ink)]' : 'bg-[var(--mag-line)]'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${hideDistance ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--mag-ink-muted)]">
        Safety Tools
      </h2>
      <div className="overflow-hidden rounded-none border border-[var(--mag-line)] bg-[var(--mag-card)]">
        <Link to="/safety" className="flex items-center gap-3 border-b border-[var(--mag-line)] px-4 py-4 no-underline transition hover:bg-[var(--mag-surface)]">
          <Shield className="h-5 w-5 text-[var(--mag-ink-soft)]" />
          <span className="flex-1 text-sm text-[var(--mag-ink)]">Safety Center</span>
        </Link>
        <button
          onClick={() => setShowBlockContacts(true)}
          className="flex w-full items-center gap-3 border-b border-[var(--mag-line)] px-4 py-4 transition hover:bg-[var(--mag-surface)]"
        >
          <Lock className="h-5 w-5 text-[var(--mag-ink-soft)]" />
          <span className="flex-1 text-left text-sm text-[var(--mag-ink)]">Block Contacts</span>
        </button>
        <button
          onClick={() => setShowBlocked(true)}
          className="flex w-full items-center gap-3 border-b border-[var(--mag-line)] px-4 py-4 transition hover:bg-[var(--mag-surface)]"
        >
          <Ban className="h-5 w-5 text-[var(--mag-ink-soft)]" />
          <span className="flex-1 text-left text-sm text-[var(--mag-ink)]">Blocked Users</span>
        </button>
        <button
          onClick={() => setShowReport(true)}
          className="flex w-full items-center gap-3 px-4 py-4 transition hover:bg-[var(--mag-surface)]"
        >
          <Flag className="h-5 w-5 text-[var(--mag-ink-soft)]" />
          <span className="flex-1 text-left text-sm text-[var(--mag-ink)]">Report a Problem</span>
        </button>
      </div>

      {/* Blocked Users Dialog */}
      {showBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 border border-[var(--mag-line)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--mag-ink)]">Blocked Users</h3>
              <button onClick={() => setShowBlocked(false)} className="rounded-full p-1 text-[var(--mag-ink-muted)] hover:bg-[var(--mag-surface)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="py-4 text-center text-sm text-[var(--mag-ink-soft)]">
              You haven&apos;t blocked anyone yet.
            </p>
            <button
              onClick={() => setShowBlocked(false)}
              className="w-full rounded-full bg-[var(--mag-ink)] py-2.5 text-sm font-semibold text-[var(--mag-bg)] transition hover:opacity-80"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Block Contacts Dialog */}
      {showBlockContacts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 border border-[var(--mag-line)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--mag-ink)]">Block Contacts</h3>
              <button onClick={() => setShowBlockContacts(false)} className="rounded-full p-1 text-[var(--mag-ink-muted)] hover:bg-[var(--mag-surface)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-sm text-[var(--mag-ink-soft)]">
              Upload your contacts to block people you know from seeing your profile.
            </p>
            <button
              onClick={() => {
                setShowBlockContacts(false)
                alert('Contacts uploaded and blocked (demo)')
              }}
              className="mb-2 w-full rounded-full bg-[var(--mag-ink)] py-2.5 text-sm font-semibold text-[var(--mag-bg)] transition hover:opacity-80"
            >
              Upload Contacts
            </button>
            <button
              onClick={() => setShowBlockContacts(false)}
              className="w-full rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Report Dialog */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 border border-[var(--mag-line)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--mag-ink)]">Report a Problem</h3>
              <button onClick={() => setShowReport(false)} className="rounded-full p-1 text-[var(--mag-ink-muted)] hover:bg-[var(--mag-surface)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
              className="mb-4 w-full resize-none rounded-2xl border border-[var(--mag-line)] bg-[var(--input-bg)] p-3 text-sm text-[var(--mag-ink)] placeholder:text-[var(--mag-ink-muted)] focus:border-[var(--mag-ink)] focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowReport(false)}
                className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowReport(false)
                  setReportReason('')
                  alert('Report submitted. Thank you!')
                }}
                className="flex-1 rounded-full bg-[var(--mag-ink)] py-2.5 text-sm font-semibold text-[var(--mag-bg)] transition hover:opacity-80"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
