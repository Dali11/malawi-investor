import type { Metadata } from 'next'
import './globals.css'

const BASE_URL = 'https://malawi-investor.vercel.app' //update when i buy the domain

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'Malawi Investor',
    template: '%s | Malawi Investor',  // article pages become "NBM Analysis | Malawi Investor"
  },

  description: 'MSE stock analysis, investing courses, and market data for Malawian investors.',

  keywords: [
    'Malawi Stock Exchange', 'MSE', 'MSE stocks', 'Malawi investing',
    'NBM shares', 'TNM shares', 'NICO shares', 'Malawi shares',
    'stock analysis Malawi', 'how to invest in Malawi',
  ],

  authors: [{ name: 'Malawi Investor' }],

  openGraph: {
    type: 'website',
    locale: 'en_MW',
    url: BASE_URL,
    siteName: 'Malawi Investor',
    title: 'Malawi Investor',
    description: 'MSE stock analysis, investing courses, and market data for Malawian investors.',
    images: [
      {
        url: '/og-default.png', // create a 1200x630 branded image and put it in /public
        width: 1200,
        height: 630,
        alt: 'Malawi Investor — MSE Analysis & Investing',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Malawi Investor',
    description: 'MSE stock analysis, investing courses, and market data for Malawian investors.',
    images: ['/og-default.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  alternates: {
    canonical: BASE_URL,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Runs before paint so the public site matches the visitor's
          saved choice, or their OS/browser preference on first visit,
          with no flash of the wrong theme. Only ever touches <html>'s
          class — the actual colors live in .public-shell in globals.css,
          so /admin, /account, /learn etc. are unaffected either way.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mi-theme');if(t!=='theme-light'&&t!=='theme-dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'theme-light':'theme-dark'}document.documentElement.classList.add(t)}catch(e){}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}