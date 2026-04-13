"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getConsentStatus, setConsentStatus } from "@/lib/cookie-consent"

interface Props {
  onAccept: () => void
  onDecline: () => void
}

export function CookieConsent({ onAccept, onDecline }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (getConsentStatus() === null) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  function handleAccept() {
    setConsentStatus("accepted")
    setVisible(false)
    onAccept()
  }

  function handleDecline() {
    setConsentStatus("declined")
    setVisible(false)
    onDecline()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Utilizamos cookies para análise de uso da aplicação. Ao aceitar, concorda com a recolha de dados
          para melhorar a sua experiência.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleDecline}>
            Recusar
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  )
}
