'use client'

import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { Prompt } from 'next/font/google'
import I18nProvider from '@/components/I18nProvider'

  const prompt = Prompt({
    subsets: ['latin', 'thai'],
    weight: ['300', '400', '500', '600', '700'],
  })
export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="th" className={prompt.className}>
      <body>
        <SessionProvider>
          <I18nProvider>{children}</I18nProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
