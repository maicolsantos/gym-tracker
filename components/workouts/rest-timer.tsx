"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, Plus, Bell, Volume2, X, ChevronUp, ChevronDown, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RestTimerProps {
  initialSeconds?: number
  activeRestSeconds?: number | null
  onClose?: () => void
  isFloating?: boolean
}

let sharedAudioCtx: AudioContext | null = null

function playTimerChime() {
  if (typeof window === "undefined") return
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioCtx()
    }
    const ctx = sharedAudioCtx
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime

    // Sequência de 3 beeps harmônicos suaves
    const tones = [587.33, 880, 1174.66] // D5, A5, D6
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, now + idx * 0.12)

      gain.gain.setValueAtTime(0, now + idx * 0.12)
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.12)
      osc.stop(now + idx * 0.12 + 0.25)
    })
  } catch (err) {
    console.error("Audio chime error:", err)
  }
}

export function RestTimer({ initialSeconds = 60, activeRestSeconds, onClose, isFloating = false }: RestTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds)
  const [remaining, setRemaining] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Quando receber novo tempo ativado externamente (ex: clicou em "Iniciar Descanso" de um exercício)
  useEffect(() => {
    if (activeRestSeconds && activeRestSeconds > 0) {
      setTotalSeconds(activeRestSeconds)
      setRemaining(activeRestSeconds)
      setIsRunning(true)
      setIsFinished(false)
      setIsMinimized(false)
    }
  }, [activeRestSeconds])

  useEffect(() => {
    if (isRunning && remaining > 0) {
      timerRef.current = setTimeout(() => {
        setRemaining((prev) => prev - 1)
      }, 1000)
    } else if (isRunning && remaining === 0) {
      setIsRunning(false)
      setIsFinished(true)
      playTimerChime()
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 300])
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isRunning, remaining])

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleStart = () => {
    if (remaining === 0) {
      setRemaining(totalSeconds)
      setIsFinished(false)
    }
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setRemaining(totalSeconds)
    setIsFinished(false)
  }

  const handleSetPreset = (secs: number) => {
    setTotalSeconds(secs)
    setRemaining(secs)
    setIsRunning(true)
    setIsFinished(false)
  }

  const handleAddSeconds = (secs: number) => {
    setRemaining((prev) => Math.max(0, prev + secs))
    setTotalSeconds((prev) => Math.max(prev, remaining + secs))
    if (isFinished) setIsFinished(false)
  }

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0

  // Se for floating ou minimizado:
  if (isFloating || isMinimized) {
    return (
      <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-88 z-50 rounded-2xl border bg-background/95 p-2.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 ring-1 ring-border">
        {/* Barra de progresso contínua */}
        <div
          className={cn(
            "absolute top-0 left-0 h-1 bg-primary rounded-t-2xl transition-all duration-300",
            isFinished && "bg-emerald-500"
          )}
          style={{ width: `${Math.min(100, progressPercent)}%` }}
        />

        <div className="flex items-center justify-between gap-2">
          {/* Lado Esquerdo: Ícone + Tempo */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
                isRunning ? "bg-primary/10 text-primary border-primary/30 animate-pulse" : "bg-muted text-muted-foreground",
                isFinished && "bg-emerald-500 text-white border-emerald-600"
              )}
            >
              <Timer className="h-4 w-4" />
            </div>

            <div className="flex flex-col min-w-0">
              <span
                className={cn(
                  "font-mono text-base font-extrabold leading-none",
                  isFinished ? "text-emerald-500 animate-bounce" : "text-foreground"
                )}
              >
                {isFinished ? "Hora da Série!" : formatTime(remaining)}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {isRunning ? `Descanso (${totalSeconds}s)` : isFinished ? "Descanso finalizado" : "Pausado"}
              </span>
            </div>
          </div>

          {/* Lado Direito: Ações */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-[11px] font-mono rounded-lg"
              onClick={() => handleAddSeconds(15)}
            >
              +15s
            </Button>

            {isRunning ? (
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-3 rounded-lg text-xs font-semibold gap-1"
                onClick={handlePause}
              >
                <Pause className="h-3.5 w-3.5 fill-current" /> Pausar
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 px-3 rounded-lg text-xs font-semibold gap-1"
                onClick={handleStart}
              >
                <Play className="h-3.5 w-3.5 fill-current" /> {isFinished ? "De novo" : "Iniciar"}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={handleReset}
              title="Reiniciar"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg -mr-1"
                onClick={onClose}
                title="Fechar"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Linha inferior de presets rápidos se estiver ativo */}
        <div className="grid grid-cols-5 gap-1 pt-2 mt-2 border-t text-[11px]">
          {[30, 45, 60, 90, 120].map((preset) => (
            <button
              key={preset}
              onClick={() => handleSetPreset(preset)}
              className={cn(
                "py-1 rounded font-mono text-center transition-colors font-medium",
                totalSeconds === preset && isRunning
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {preset}s
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Versão Sidebar Padrão (Desktop)
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-all duration-300",
        isFinished && "border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/20"
      )}
    >
      {/* Barra de progresso contínua */}
      <div
        className={cn(
          "absolute top-0 left-0 h-1 bg-primary transition-all duration-300",
          isFinished && "bg-emerald-500"
        )}
        style={{ width: `${Math.min(100, progressPercent)}%` }}
      />

      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Timer className={cn("h-4 w-4", isRunning ? "text-primary animate-pulse" : "text-muted-foreground")} />
          <span className="text-sm font-semibold">Cronômetro de Descanso</span>
        </div>
        <div className="flex items-center gap-1">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              title="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center my-4">
        <div
          className={cn(
            "font-mono text-4xl sm:text-5xl font-extrabold tracking-tight transition-colors",
            isRunning ? "text-primary" : "text-foreground",
            isFinished && "text-emerald-500 animate-pulse"
          )}
        >
          {formatTime(remaining)}
        </div>
        {isFinished && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <Bell className="h-3.5 w-3.5 animate-bounce" /> Hora da próxima série!
          </span>
        )}
      </div>

      {/* Controles Principais */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg gap-1 h-9 px-3 text-xs"
          onClick={handleReset}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Zerar
        </Button>

        {isRunning ? (
          <Button
            size="sm"
            variant="secondary"
            className="rounded-lg gap-1.5 h-9 px-4 font-semibold text-xs shadow-sm"
            onClick={handlePause}
          >
            <Pause className="h-3.5 w-3.5 fill-current" />
            Pausar
          </Button>
        ) : (
          <Button
            size="sm"
            className="rounded-lg gap-1.5 h-9 px-5 font-semibold text-xs shadow-sm"
            onClick={handleStart}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {isFinished ? "Recomeçar" : "Iniciar"}
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="rounded-lg gap-1 h-9 px-3 text-xs font-mono"
          onClick={() => handleAddSeconds(15)}
        >
          <Plus className="h-3 w-3" />
          15s
        </Button>
      </div>

      {/* Presets Rápidos */}
      <div className="pt-2 border-t">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5 text-center">
          Predefinições
        </span>
        <div className="grid grid-cols-5 gap-1">
          {[30, 45, 60, 90, 120].map((preset) => (
            <Button
              key={preset}
              variant={totalSeconds === preset && !isFinished ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-1 font-mono"
              onClick={() => handleSetPreset(preset)}
            >
              {preset}s
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
