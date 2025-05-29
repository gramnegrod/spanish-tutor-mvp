import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mexican Spanish Tutor - Learn Conversational Spanish",
  description: "Practice conversational Mexican Spanish with AI-powered voice conversations",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
