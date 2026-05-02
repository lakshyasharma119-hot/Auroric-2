import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AppProvider } from '@/lib/app-context'
import { ThemeProvider } from '@/lib/theme-context'
import AuthSessionProvider from '@/components/session-provider'
import FloatingNav from '@/components/floating-nav'

import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Auroric - Luxury Inspiration Platform',
  description: 'Discover, create, and share inspiration on Auroric. A premium Pinterest-inspired platform for curating and exploring beautiful ideas.',
  generator: 'v0.app',
  keywords: 'inspiration, boards, pins, design, luxury, auroric',
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
    var t = localStorage.getItem('auroric-theme');
    if (t && t !== 'crimson') document.documentElement.setAttribute('data-theme', t);
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
              {children}
              <FloatingNav />
            </AppProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
