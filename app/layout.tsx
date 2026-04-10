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
  title: 'SaaSMatch',
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
      </body>
    </html>
  )
}
