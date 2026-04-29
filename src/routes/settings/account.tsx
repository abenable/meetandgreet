import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Mail, Phone, Globe, Trash2, Pencil, X } from 'lucide-react'

export const Route = createFileRoute('/settings/account')({ component: AccountSettingsPage })

function AccountSettingsPage() {
  const [email, setEmail] = useState('user@example.com')
  const [phone, setPhone] = useState('+1 (555) 012-3456')
  const [language, setLanguage] = useState('English (US)')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const openEdit = (field: string, current: string) => {
    setEditingField(field)
    setEditValue(current)
  }

  const saveEdit = () => {
    if (editingField === 'email') setEmail(editValue)
    if (editingField === 'phone') setPhone(editValue)
    if (editingField === 'language') setLanguage(editValue)
    setEditingField(null)
  }

  const fieldMeta: Record<string, { label: string; icon: React.ElementType }> = {
    email: { label: 'Email', icon: Mail },
    phone: { label: 'Phone', icon: Phone },
    language: { label: 'Language', icon: Globe },
  }

  return (
    <main className="page-wrap px-4 py-4">
      <div className="mb-5 text-center">
        <Link to="/settings" className="absolute left-4 top-4 rounded-full p-2 text-[var(--mag-ink-soft)] hover:bg-[var(--mag-surface)] no-underline">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-[var(--mag-ink)]">Account Settings</h1>
      </div>

      <div className="mb-5 overflow-hidden rounded-2xl border border-[var(--mag-line)] bg-[var(--mag-card)]">
        <button
          onClick={() => openEdit('email', email)}
          className="flex w-full items-center gap-3 border-b border-[var(--mag-line)] px-4 py-3 transition hover:bg-[var(--mag-surface)] text-left"
        >
          <Mail className="h-5 w-5 text-[var(--mag-ink-soft)]" />
          <div className="flex-1">
            <p className="text-xs text-[var(--mag-ink-muted)]">Email</p>
            <p className="text-sm text-[var(--mag-ink)]">{email}</p>
          </div>
          <Pencil className="h-3.5 w-3.5 text-[var(--mag-ink-muted)]" />
        </button>
        <button
          onClick={() => openEdit('phone', phone)}
          className="flex w-full items-center gap-3 border-b border-[var(--mag-line)] px-4 py-3 transition hover:bg-[var(--mag-surface)] text-left"
        >
          <Phone className="h-5 w-5 text-[var(--mag-ink-soft)]" />
          <div className="flex-1">
            <p className="text-xs text-[var(--mag-ink-muted)]">Phone</p>
            <p className="text-sm text-[var(--mag-ink)]">{phone}</p>
          </div>
          <Pencil className="h-3.5 w-3.5 text-[var(--mag-ink-muted)]" />
        </button>
        <button
          onClick={() => openEdit('language', language)}
          className="flex w-full items-center gap-3 px-4 py-3 transition hover:bg-[var(--mag-surface)] text-left"
        >
          <Globe className="h-5 w-5 text-[var(--mag-ink-soft)]" />
          <div className="flex-1">
            <p className="text-xs text-[var(--mag-ink-muted)]">Language</p>
            <p className="text-sm text-[var(--mag-ink)]">{language}</p>
          </div>
          <Pencil className="h-3.5 w-3.5 text-[var(--mag-ink-muted)]" />
        </button>
      </div>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--mag-ink-muted)]">
        Danger Zone
      </h2>
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 transition hover:bg-red-500/20"
      >
        <Trash2 className="h-5 w-5 text-red-500" />
        <span className="flex-1 text-left text-sm font-semibold text-red-500">Delete Account</span>
      </button>

      {/* Edit Dialog */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--mag-ink)]">
                Edit {fieldMeta[editingField]?.label}
              </h3>
              <button onClick={() => setEditingField(null)} className="rounded-full p-1 text-[var(--mag-ink-muted)] hover:bg-[var(--mag-surface)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="mb-4 w-full rounded-xl border border-[var(--mag-line)] bg-[var(--input-bg)] p-3 text-sm text-[var(--mag-ink)] focus:border-[var(--mag-green)] focus:outline-none focus:ring-2 focus:ring-[var(--mag-green)]/20"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEditingField(null)}
                className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 rounded-full bg-[var(--mag-green)] py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--mag-green-dark)]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--mag-card)] p-5 shadow-xl">
            <div className="mb-1 flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Delete Account</h3>
            </div>
            <p className="mb-4 text-sm text-[var(--mag-ink-soft)]">
              This will permanently delete your account and all your data. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-full border border-[var(--mag-line)] bg-[var(--mag-card)] py-2.5 text-sm font-medium text-[var(--mag-ink)] transition hover:bg-[var(--mag-surface)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  alert('Account deleted (demo)')
                }}
                className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
