"use client"

import Link from "next/link"
import { Home, Users, Settings, Sun, Moon, Monitor, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme, type Theme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { XpBadge } from "@/components/xp-badge"
import { useHumiliationsInbox } from "@/hooks/use-humiliations-inbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Claro", icon: <Sun className="h-4 w-4" /> },
  { value: "dark", label: "Escuro", icon: <Moon className="h-4 w-4" /> },
  { value: "system", label: "Sistema", icon: <Monitor className="h-4 w-4" /> },
]

export function AppHeader() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { humiliation, activeHumiliation } = useHumiliationsInbox(user?.uid ?? null)
  const avatarEmoji =
    activeHumiliation &&
    (activeHumiliation.itemSnapshot.category === "avatar" ||
      activeHumiliation.itemSnapshot.category === "combo")
      ? (activeHumiliation.itemSnapshot.emoji ?? null)
      : null

  if (!user) return null

  const firstName = user.displayName?.split(" ")[0] ?? ""
  const initials =
    user.displayName
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") ?? "?"

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Esquerda: avatar + nome — link para home */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Avatar className="h-8 w-8 shrink-0">
            {!avatarEmoji && (
              <AvatarImage src={user.photoURL ?? ""} referrerPolicy="no-referrer" />
            )}
            <AvatarFallback className={avatarEmoji ? "text-base" : "text-xs"}>
              {avatarEmoji ?? initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="flex items-center gap-1.5 leading-tight">
              <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-none">
                {firstName}
              </span>
              {activeHumiliation?.itemSnapshot.nicknameText && (
                <span className="inline-flex items-center rounded-full border border-yellow-500/50 bg-yellow-500/15 px-1.5 py-0 text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 whitespace-nowrap">
                  {activeHumiliation.itemSnapshot.nicknameText}
                </span>
              )}
            </span>
            <XpBadge />
          </div>
        </Link>

        {/* Direita: home, amigos, gear dropdown */}
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild title="Início">
            <Link href="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild title="Amigos">
            <Link href="/friends">
              <Users className="h-4 w-4" />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Definições">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {themeOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                  {theme === opt.value && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
