import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
title: "Kiosk",
description: "AI-enabled food ordering kiosk.",
metadataBase: new URL("https://kiosk.dionola.com"),
openGraph: {
  title: "Kiosk",
  description: "AI-enabled food ordering kiosk.",
  url: "https://kiosk.dionola.com",
  siteName: "Kiosk",
  images: [{ url: "https://ejyic7eskr7jje45.public.blob.vercel-storage.com/jollibee-thumbnail.png", width: 1200,
height: 630 }],
  type: "website",
},
twitter: {
  card: "summary_large_image",
  title: "Kiosk",
  description: "AI-enabled food ordering kiosk.",
  images: ["https://ejyic7eskr7jje45.public.blob.vercel-storage.com/jollibee-thumbnail.png"],
},
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
