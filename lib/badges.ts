export interface BadgeContext {
  workoutDates: string[]
  xpTotal: number
  friendsCount: number
  monthlyRankings: { yearMonth: string; position: number; participantsCount: number }[]
  humiliationsSent: { recipientUid: string; yearMonth: string }[]
  humiliationsReceived: { senderUid: string; yearMonth: string }[]
}

function getISOWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  const dayOfWeek = (d.getDay() + 6) % 7 // Mon=0, Sun=6
  const thursday = new Date(d)
  thursday.setDate(d.getDate() - dayOfWeek + 3)
  const yearStart = new Date(thursday.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${thursday.getFullYear()}-W${String(weekNum).padStart(2, "0")}`
}

function hasConsecutiveMonths(yearMonths: string[], count: number): boolean {
  if (yearMonths.length < count) return false
  const sorted = [...yearMonths].sort()
  for (let i = 0; i <= sorted.length - count; i++) {
    let ok = true
    for (let j = 1; j < count; j++) {
      const [y, m] = sorted[i + j - 1].split("-").map(Number)
      const next = new Date(y, m, 1)
      const expected = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`
      if (sorted[i + j] !== expected) { ok = false; break }
    }
    if (ok) return true
  }
  return false
}

function prevYearMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function evaluateBadges(ctx: BadgeContext): Record<string, boolean> {
  const { workoutDates, xpTotal, friendsCount, monthlyRankings, humiliationsSent, humiliationsReceived } = ctx

  // Consistência
  const weekCounts = new Map<string, number>()
  const monthCounts = new Map<string, number>()
  for (const d of workoutDates) {
    const wk = getISOWeekKey(d)
    weekCounts.set(wk, (weekCounts.get(wk) ?? 0) + 1)
    const mo = d.slice(0, 7)
    monthCounts.set(mo, (monthCounts.get(mo) ?? 0) + 1)
  }

  const primeiro_passo   = workoutDates.length >= 1
  const semana_completa  = [...weekCounts.values()].some(c => c >= 5)
  const mes_solido       = [...monthCounts.values()].some(c => c >= 20)
  const centuriao        = workoutDates.length >= 100
  const guerreiro_ferro  = workoutDates.length >= 365

  // Ranking
  const rei_do_mes = monthlyRankings.some(r => r.position === 1 && r.participantsCount >= 2)
  const podio      = monthlyRankings.some(r => r.position <= 3 && r.participantsCount >= 2)

  const ymsFirst = monthlyRankings
    .filter(r => r.position === 1 && r.participantsCount >= 2)
    .map(r => r.yearMonth)
  const ymsTop3 = monthlyRankings
    .filter(r => r.position <= 3 && r.participantsCount >= 2)
    .map(r => r.yearMonth)

  const dinastia   = hasConsecutiveMonths(ymsFirst, 3)
  const consistente = hasConsecutiveMonths(ymsTop3, 3)

  // Humilhação
  const primeiro_sangue = humiliationsSent.length >= 1
  const algoz           = humiliationsSent.length >= 5

  let vinganca = false
  for (const sent of humiliationsSent) {
    const prev = prevYearMonth(sent.yearMonth)
    // Vingança: sent to Y in month M, and Y had sent to me in month M-1
    if (humiliationsReceived.some(r => r.senderUid === sent.recipientUid && r.yearMonth === prev)) {
      vinganca = true
      break
    }
  }

  const blindado = humiliationsReceived.length >= 10

  // XP
  const iniciante  = xpTotal >= 100
  const veterano   = xpTotal >= 500
  const elite      = xpTotal >= 1000
  const lenda      = xpTotal >= 5000

  // Social
  const nao_treina_sozinho = friendsCount >= 1
  const gang               = friendsCount >= 10
  const lider_comunidade   = friendsCount >= 25

  return {
    primeiro_passo, semana_completa, mes_solido, centuriao, guerreiro_ferro,
    rei_do_mes, podio, dinastia, consistente,
    primeiro_sangue, algoz, vinganca, blindado,
    iniciante, veterano, elite, lenda,
    nao_treina_sozinho, gang, lider_comunidade,
  }
}
