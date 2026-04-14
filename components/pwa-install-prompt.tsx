"use client"

import { useEffect, useRef, useState } from "react"
import { X, Download, Share } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true

    if (isStandalone) return
    if (localStorage.getItem("pwa-install-dismissed") === "1") return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
    setIsIOS(ios)

    if (ios) {
      const timer = setTimeout(() => setShow(true), 2000)
      return () => clearTimeout(timer)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setTimeout(() => setShow(true), 2000)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt.current) return
    try {
      await deferredPrompt.current.prompt()
      const { outcome } = await deferredPrompt.current.userChoice
      deferredPrompt.current = null
      if (outcome === "accepted") setShow(false)
    } catch {
      deferredPrompt.current = null
      setShow(false)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem("pwa-install-dismissed", "1")
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border bg-background shadow-lg p-4 flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8234e9]">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Instalar aplicação</p>
            <p className="text-xs text-muted-foreground">Acesso rápido direto do ecrã inicial</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mt-0.5 -mr-1" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isIOS ? (
        <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Toca em{" "}
          <Share className="inline h-3.5 w-3.5 align-text-bottom" />{" "}
          e depois em <span className="font-medium text-foreground">"Adicionar ao ecrã inicial"</span>
        </div>
      ) : (
        <Button size="sm" className="w-full bg-[#8234e9] hover:bg-[#6f28cc]" onClick={handleInstall}>
          Instalar
        </Button>
      )}
    </div>
  )
}
