import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mythsensus — Where Myriad Myths Reach Consensus About You',
  description: 'Cosmic score from 26 ancient wisdom systems. BaZi · Vedic · Western · Mayan · Norse · Human Design and 20 more. Your soul frequency in 60 seconds.',
  keywords: 'horoscope, birth chart, cosmic blueprint, BaZi, Vedic astrology, numerology, Human Design, Thai astrology',
  openGraph: {
    title: 'Mythsensus — 26 Ancient Systems, One Cosmic Score',
    description: 'Where myriad myths reach consensus — about you.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        {/* QA-6: charset must be explicit on every page */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
