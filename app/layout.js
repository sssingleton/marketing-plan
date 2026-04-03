import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Marketing Plan — The Cake Records',
  description: 'AI-powered 8-week social media marketing plans for your next release. Strategic content planning meets creative automation.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0a0a] text-[#fafaf9]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
