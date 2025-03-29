import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SonnerProvider } from "@/components/sonner-provider"
import { DataProvider } from "@/lib/data-store"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Grain Tracker",
  description: "Track your maize business expenses, sales, and inventory",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
      <DataProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <SonnerProvider />
        </ThemeProvider>
      </DataProvider>
        
      </body>
    </html>
  )
}

