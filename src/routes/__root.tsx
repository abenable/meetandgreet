import { HeadContent, Outlet, Scripts, createRootRouteWithContext, redirect } from '@tanstack/react-router'
import Footer from '../components/Footer'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { getSession } from '#/server/auth'

interface MyRouterContext {
  queryClient: QueryClient
  session?: Awaited<ReturnType<typeof getSession>>
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
    const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/about', '/api', '/events/join']
    const isPublic = publicPaths.some(
      (p) => location.pathname === p || location.pathname.startsWith(p + '/')
    )

    const session = await getSession()

    if (isPublic) {
      return { session }
    }

    if (!session) {
      throw redirect({ to: '/login' })
    }

    return { session }
  },
  component: RootLayout,
  shellComponent: RootDocument,
})

function RootLayout() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col bg-[var(--mag-bg)]">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
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
