export type ShopCategory = "nickname" | "avatar" | "combo"

export interface ShopItem {
  id: string
  title: string
  description: string
  xpCost: number
  category: ShopCategory
  emoji?: string
  nicknameText?: string
}

export const SHOP_CATALOG: ShopItem[] = [
  // ── Alcunhas (50–150 XP) ────────────────────────────────────────────────────
  {
    id: "nickname_treina_fofo",
    title: "Treina Fofo",
    description: "Etiqueta de ginásio muito casual",
    xpCost: 50,
    category: "nickname",
    nicknameText: "Treina Fofo",
  },
  {
    id: "nickname_rei_cardio",
    title: "Rei do Cardio Suave",
    description: "Mestre das caminhadas leves",
    xpCost: 60,
    category: "nickname",
    nicknameText: "Rei do Cardio Suave",
  },
  {
    id: "nickname_atleta_segunda",
    title: "Atleta de Segunda",
    description: "Começa sempre na segunda-feira",
    xpCost: 80,
    category: "nickname",
    nicknameText: "Atleta de Segunda",
  },
  {
    id: "nickname_musculo_decoracao",
    title: "Músculo de Decoração",
    description: "Exibe mas não usa",
    xpCost: 100,
    category: "nickname",
    nicknameText: "Músculo de Decoração",
  },
  {
    id: "nickname_levanta_palhinhas",
    title: "Levanta Palhinhas",
    description: "Especialista em pesos mínimos",
    xpCost: 120,
    category: "nickname",
    nicknameText: "Levanta Palhinhas",
  },
  {
    id: "nickname_campeao_banco",
    title: "Campeão do Banco",
    description: "O banco do vestiário é o melhor amigo",
    xpCost: 150,
    category: "nickname",
    nicknameText: "Campeão do Banco",
  },

  // ── Foto de perfil (200–400 XP) ─────────────────────────────────────────────
  {
    id: "avatar_halter",
    title: "Halter Leve",
    description: "Foto substituída pelo emoji 🏋️",
    xpCost: 200,
    category: "avatar",
    emoji: "🏋️",
  },
  {
    id: "avatar_colher",
    title: "A Colher",
    description: "Mais útil na cozinha do que no ginásio",
    xpCost: 250,
    category: "avatar",
    emoji: "🥄",
  },
  {
    id: "avatar_tartaruga",
    title: "A Tartaruga",
    description: "Devagar e sempre… ênfase no devagar",
    xpCost: 300,
    category: "avatar",
    emoji: "🐢",
  },
  {
    id: "avatar_a_dormir",
    title: "A Dormir",
    description: "A foto confirma o que todos suspeitavam",
    xpCost: 350,
    category: "avatar",
    emoji: "😴",
  },
  {
    id: "avatar_pena",
    title: "A Pena",
    description: "Leve como uma pena, treina como uma",
    xpCost: 400,
    category: "avatar",
    emoji: "🪶",
  },

  // ── Combinados (500+ XP) ────────────────────────────────────────────────────
  {
    id: "combo_fofo_colher",
    title: "Fofo com Colher",
    description: "Alcunha 'Treina Fofo' + foto 🥄",
    xpCost: 500,
    category: "combo",
    emoji: "🥄",
    nicknameText: "Treina Fofo",
  },
  {
    id: "combo_segunda_tartaruga",
    title: "Atleta Tartaruga",
    description: "Alcunha 'Atleta de Segunda' + foto 🐢",
    xpCost: 600,
    category: "combo",
    emoji: "🐢",
    nicknameText: "Atleta de Segunda",
  },
  {
    id: "combo_banco_dormindo",
    title: "Campeão Adormecido",
    description: "Alcunha 'Campeão do Banco' + foto 😴",
    xpCost: 700,
    category: "combo",
    emoji: "😴",
    nicknameText: "Campeão do Banco",
  },
  {
    id: "combo_pena_palhinhas",
    title: "Pluma Atlética",
    description: "Alcunha 'Levanta Palhinhas' + foto 🪶",
    xpCost: 800,
    category: "combo",
    emoji: "🪶",
    nicknameText: "Levanta Palhinhas",
  },
]

export const CATEGORY_LABELS: Record<ShopCategory, string> = {
  nickname: "Alcunhas",
  avatar: "Foto de Perfil",
  combo: "Combinados",
}
