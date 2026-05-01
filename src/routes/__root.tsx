import { HeadContent, Outlet, Scripts, createRootRouteWithContext, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import Footer from '../components/Footer'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import PWAInstallPrompt from '../components/PWAInstallPrompt'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { getSession } from '#/server/auth'

interface MyRouterContext {
  queryClient: QueryClient
  session?: Awaited<ReturnType<typeof getSession>>
}

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/about', '/api', '/events/join']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
      },
      { title: 'Meet & Greet' },
      { name: 'description', content: 'Meet & Greet - Connect with people' },
      { name: 'theme-color', content: '#10B981' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'Meet & Greet' },
    ],
    links: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
      {
        rel: 'alternate icon',
        href: '/favicon.ico',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  beforeLoad: async ({ location }) => {
    const isPublic = isPublicPath(location.pathname)

    let session: Awaited<ReturnType<typeof getSession>> = null
    try {
      session = await getSession()
    } catch {
      // If session fetch fails, treat as unauthenticated
    }

    if (isPublic) {
      return { session }
    }

    if (!session?.session) {
      throw redirect({ to: '/login' })
    }

    return { session }
  },
  component: RootLayout,
  shellComponent: RootDocument,
  notFoundComponent: () => (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-lg text-[var(--mag-ink-soft)]">Page not found</p>
    </div>
  ),
})

function RootLayout() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const register = async () => {
        try {
          const { registerSW } = await import('virtual:pwa-register')
          registerSW({
            immediate: true,
            onRegistered(_registration) {
              // console.log('[PWA] Service Worker registered')
            },
            onRegisterError(_error) {
              // console.error('[PWA] Service Worker registration error')
            },
          })
        } catch (error) {
          console.error('[PWA] Service Worker registration setup failed', error)
        }
      }
      void register()
    }
  }, [])

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col bg-[var(--mag-bg)]">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <PWAInstallPrompt />
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mag-theme')||'light';if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans antialiased flex flex-col min-h-[100dvh]">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
