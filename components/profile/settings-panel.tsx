"use client"

import { Sun, Moon, Monitor, Download, ShieldOff, Trash2, LogOut } from "lucide-react"
import { type User } from "firebase/auth"
import { useTheme, type Theme } from "@/contexts/theme-context"
import { useAuth } from "@/contexts/auth-context"
import { exportUserData } from "@/lib/export-data"
import { revokeConsent } from "@/lib/cookie-consent"
import { DeleteAccountDialog } from "@/components/delete-account-dialog"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface SettingsPanelProps {
  user: User
}

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light",  label: "Claro",   icon: <Sun className="h-4 w-4" /> },
  { value: "dark",   label: "Escuro",  icon: <Moon className="h-4 w-4" /> },
  { value: "system", label: "Sistema", icon: <Monitor className="h-4 w-4" /> },
]

export function SettingsPanel({ user }: SettingsPanelProps) {
  const { theme, setTheme } = useTheme()
  const { signOut } = useAuth()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Definições</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Tema</p>
          <ToggleGroup
            type="single"
            value={theme}
            onValueChange={(v) => v && setTheme(v as Theme)}
            variant="outline"
            className="w-full"
          >
            {themeOptions.map((opt) => (
              <ToggleGroupItem key={opt.value} value={opt.value} aria-label={opt.label} className="flex items-center gap-1.5">
                {opt.icon}
                <span className="text-xs">{opt.label}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <Separator />

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() =>
              exportUserData(user.uid).catch((err) => console.error("Erro ao exportar dados:", err))
            }
          >
            <Download className="h-4 w-4" />
            Exportar dados
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => { revokeConsent(); window.location.reload() }}
          >
            <ShieldOff className="h-4 w-4" />
            Revogar consentimento
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <DeleteAccountDialog
            user={user}
            trigger={
              <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                Eliminar conta
              </Button>
            }
          />
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
