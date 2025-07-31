import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
// import { GlobalNav } from "@/components/navigation/GlobalNav"
import { SimpleBrowseButton } from "@/components/navigation/SimpleBrowseButton"

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
          {/* <GlobalNav /> */}
          <SimpleBrowseButton />
          <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
            {children}
          </div>
          {/* <ErrorLogViewerWrapper /> */}
        </Providers>
      </body>
    </html>
  )
}
