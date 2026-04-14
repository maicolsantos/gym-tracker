"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Analytics } from "@vercel/analytics/react"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { initAnalytics } from "@/lib/firebase"
import { CookieConsent } from "@/components/cookie-consent"
import { getConsentStatus } from "@/lib/cookie-consent"

export function Providers({ children }: { children: ReactNode }) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    if (getConsentStatus() === "accepted") {
      initAnalytics()
      setAnalyticsEnabled(true)
    }
  }, [])

  function handleAccept() {
    initAnalytics()
    setAnalyticsEnabled(true)
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        {analyticsEnabled && <Analytics />}
        <CookieConsent onAccept={handleAccept} onDecline={() => {}} />
      </AuthProvider>
    </ThemeProvider>
  )
}
