import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import Navbar from '@/components/navbar'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'FounderInvited',
  description: 'Private matchmaking for SaaS founders and investors',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans bg-white text-gray-900 antialiased`}>
        <Navbar />
        <main>{children}</main>
        <footer className="border-t border-gray-100 mt-auto">
          <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-center">
            <p className="text-sm text-gray-400">
              Questions?{' '}
              <a
                href="mailto:sammy@blossomstreetventures.com"
                className="text-[#534AB7] hover:underline"
              >
                sammy@blossomstreetventures.com
              </a>
              .&nbsp; Other tools we&apos;ve built for founders:{' '}
              <a href="https://www.softwaremultiples.com" target="_blank" rel="noopener noreferrer" className="text-[#534AB7] hover:underline">SoftwareMultiples.com</a>,{' '}
              <a href="https://www.twofounderstalk.com" target="_blank" rel="noopener noreferrer" className="text-[#534AB7] hover:underline">TwoFoundersTalk.com</a>,{' '}
              <a href="https://www.softwaremrrcalculator.com" target="_blank" rel="noopener noreferrer" className="text-[#534AB7] hover:underline">SoftwareMRRCalculator.com</a>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
