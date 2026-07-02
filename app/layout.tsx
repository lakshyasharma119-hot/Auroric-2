import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AppProvider } from '@/lib/app-context'
import { ThemeProvider } from '@/lib/theme-context'
import { ChatProvider } from '@/context/ChatContext'
import AuthSessionProvider from '@/components/session-provider'
import FloatingNav from '@/components/floating-nav'
import MobileBottomNav from '@/components/mobile-bottom-nav'
import SharePinModal from '@/components/share-pin-modal'

import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Auroric - Luxury Inspiration Platform',
  description: 'Discover, create, and share inspiration on Auroric. A premium Pinterest-inspired platform for curating and exploring beautiful ideas.',
  generator: 'v0.app',
  keywords: 'inspiration, boards, pins, design, luxury, auroric',
  icons: [
    { rel: 'icon', url: '/logo-dark-circle.png', media: '(prefers-color-scheme: light)' },
    { rel: 'icon', url: '/logo-light-circle.png', media: '(prefers-color-scheme: dark)' }
  ],
  openGraph: {
    title: 'Auroric - Luxury Inspiration Platform',
    description: 'Discover, create, and share inspiration on Auroric',
    type: 'website',
  },
}

// Inline script to apply theme before paint (prevents flash)
const themeScript = `
(function(){
  try {
    var THEMES = {
      standard_dark: 'dark',
      standard_light: 'light',
      obsidian_crimson: 'dark',
      fiery_sunset: 'dark',
      quiet_luxury: 'light',
      modern_editorial: 'dark'
    };
    var t = localStorage.getItem('auroric-theme');
    if (!t || !THEMES[t]) {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      t = prefersDark ? 'standard_dark' : 'standard_light';
    }
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-mode', THEMES[t]);
    if (THEMES[t] === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <AuthSessionProvider>
          <ThemeProvider>
            <AppProvider>
              <ChatProvider>
                {children}
                <FloatingNav />
                <MobileBottomNav />
                <SharePinModal />
              </ChatProvider>
            </AppProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
