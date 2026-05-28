import {
  Footprints,
  CalendarCheck,
  Dumbbell,
  Medal,
  ShieldCheck,
  Crown,
  Trophy,
  Swords,
  Target,
  Zap,
  Skull,
  RotateCcw,
  Shield,
  Star,
  Sparkles,
  Gem,
  Flame,
  UserPlus,
  Users,
  Globe,
  type LucideIcon,
} from "lucide-react"

export type BadgeCategory = "consistency" | "ranking" | "humiliation" | "xp" | "social"

export const CATEGORY_META: Record<BadgeCategory, { label: string; colorClass: string }> = {
  consistency: { label: "Consistência", colorClass: "bg-blue-500" },
  ranking:     { label: "Ranking",      colorClass: "bg-amber-500" },
  humiliation: { label: "Humilhação",   colorClass: "bg-red-500" },
  xp:          { label: "XP",           colorClass: "bg-purple-500" },
  social:      { label: "Social",       colorClass: "bg-green-500" },
}

export interface BadgeDefinition {
  id: string
  category: BadgeCategory
  title: string
  description: string
  icon: LucideIcon
}

export const BADGES: BadgeDefinition[] = [
  // Consistência
  { id: "primeiro_passo",     category: "consistency", title: "Primeiro Passo",       description: "Regista o teu primeiro treino.",                                    icon: Footprints },
  { id: "semana_completa",    category: "consistency", title: "Semana Completa",      description: "Treina 5 ou mais dias numa semana.",                               icon: CalendarCheck },
  { id: "mes_solido",         category: "consistency", title: "Mês Sólido",           description: "20 ou mais treinos num mês.",                                      icon: Dumbbell },
  { id: "centuriao",          category: "consistency", title: "Centurião",            description: "100 treinos registados no total.",                                 icon: Medal },
  { id: "guerreiro_ferro",    category: "consistency", title: "Guerreiro de Ferro",   description: "365 treinos registados no total.",                                 icon: ShieldCheck },

  // Ranking
  { id: "rei_do_mes",         category: "ranking",     title: "Rei do Mês",           description: "Termina em 1.º num mês com 2 ou mais participantes.",              icon: Crown },
  { id: "podio",              category: "ranking",     title: "Pódio",                description: "Termina no top 3 num mês com 2 ou mais participantes.",            icon: Trophy },
  { id: "dinastia",           category: "ranking",     title: "Dinastia",             description: "Fica em 1.º em 3 meses consecutivos.",                            icon: Swords },
  { id: "consistente",        category: "ranking",     title: "Consistente",          description: "Fica no top 3 em 3 meses consecutivos.",                          icon: Target },

  // Humilhação
  { id: "primeiro_sangue",    category: "humiliation", title: "Primeiro Sangue",      description: "Envia a tua primeira humilhação.",                                icon: Zap },
  { id: "algoz",              category: "humiliation", title: "Algoz",                description: "Envia 5 ou mais humilhações.",                                    icon: Skull },
  { id: "vinganca",           category: "humiliation", title: "Vingança",             description: "Humilha alguém que te humilhou no mês anterior.",                icon: RotateCcw },
  // Blindado: receives >= 10 humiliations — the semantic is endurance, not aggression
  { id: "blindado",           category: "humiliation", title: "Blindado",             description: "Recebe 10 ou mais humilhações.",                                  icon: Shield },

  // XP
  { id: "iniciante",          category: "xp",          title: "Iniciante",            description: "Acumula 100 XP.",                                                 icon: Star },
  { id: "veterano",           category: "xp",          title: "Veterano",             description: "Acumula 500 XP.",                                                 icon: Sparkles },
  { id: "elite",              category: "xp",          title: "Elite",                description: "Acumula 1 000 XP.",                                               icon: Gem },
  { id: "lenda",              category: "xp",          title: "Lenda",                description: "Acumula 5 000 XP.",                                               icon: Flame },

  // Social
  { id: "nao_treina_sozinho", category: "social",      title: "Não Treina Sozinho",   description: "Adiciona o teu primeiro amigo.",                                  icon: UserPlus },
  { id: "gang",               category: "social",      title: "Gang",                 description: "Tem 10 ou mais amigos.",                                          icon: Users },
  { id: "lider_comunidade",   category: "social",      title: "Líder da Comunidade",  description: "Tem 25 ou mais amigos.",                                          icon: Globe },
]
