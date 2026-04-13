"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface FriendCodeDisplayProps {
  code: string
}

export function FriendCodeDisplay({ code }: FriendCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success("Código copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Não foi possível copiar o código")
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-sm text-muted-foreground">Partilha este código com os teus amigos</p>
      <div className="flex items-center gap-3">
        <span className="text-4xl font-mono font-bold tracking-widest select-all">{code}</span>
        <Button variant="outline" size="icon" onClick={handleCopy} title="Copiar código">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
