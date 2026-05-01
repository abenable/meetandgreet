import { useEffect, useRef, useState, useCallback } from 'react'

const STORAGE_KEY = 'mag-pwa-install-dismissed'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 1 week

function readDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const expiry = parseInt(raw, 10)
    return !isNaN(expiry) && Date.now() < expiry
  } catch {
    return false
  }
}

function writeDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + DISMISS_DURATION_MS))
  } catch {
    /* noop */
  }
}

function clearDismissed() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}

function checkInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error iOS standalone
    window.navigator.standalone === true
  )
}

export interface UsePWAInstallReturn {
  canInstall: boolean
  dismissed: boolean
  installed: boolean
  prompt: () => Promise<boolean>
  dismiss: () => void
}

export function usePWAInstall(): UsePWAInstallReturn {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setInstalled(checkInstalled())
    setDismissed(readDismissed())

    const onBeforeInstall = (e: Event) => {
      const evt = e as BeforeInstallPromptEvent
      evt.preventDefault()
      deferred.current = evt
      setCanInstall(true)
      setInstalled(false)
    }

    const onInstalled = () => {
      deferred.current = null
      setCanInstall(false)
      setInstalled(true)
      clearDismissed()
    }

    const onChange = (e: MediaQueryListEvent) => setInstalled(e.matches)
    const mql = window.matchMedia('(display-mode: standalone)')

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    try {
      mql.addEventListener('change', onChange)
    } catch {
      try {
        mql.addListener(onChange)
      } catch {
        /* noop */
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      try {
        mql.removeEventListener('change', onChange)
      } catch {
        try {
          mql.removeListener(onChange)
        } catch {
          /* noop */
        }
      }
    }
  }, [])

  const prompt = useCallback(async (): Promise<boolean> => {
    const p = deferred.current
    if (!p) return false
    try {
      await p.prompt()
      deferred.current = null
      setCanInstall(false)
      const { outcome } = await p.userChoice
      if (outcome === 'accepted') {
        setInstalled(true)
        clearDismissed()
      }
      return outcome === 'accepted'
    } catch {
      deferred.current = null
      setCanInstall(false)
      return false
    }
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    setCanInstall(false)
    writeDismissed()
  }, [])

  return { canInstall, dismissed, installed, prompt, dismiss }
}
