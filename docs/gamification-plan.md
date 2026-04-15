# Plano: Gamificação com XP + Loja de Humilhações

## Visão Geral

Adicionar uma camada de gamificação ao Gym Tracker: cada treino marcado concede XP, o ranking mensal atribui bónus de XP por posição, e o XP acumulado pode ser gasto numa **Loja de Humilhações** para enviar efeitos visuais divertidos a amigos que ficaram atrás no ranking mensal.

As humilhações são **puramente digitais e dentro da app** (sem tarefas do mundo real), privadas (visíveis apenas para remetente e destinatário), e exibidas de forma aleatória a cada abertura da app.

---

## Sistema de XP

### Constantes

| Evento | XP |
|--------|-----|
| Dia de treino marcado | +10 |
| 1.º lugar ranking mensal | +100 |
| 2.º lugar | +60 |
| 3.º lugar | +40 |
| 4.º lugar | +20 |
| 5.º+ lugar | +10 |

### Regras
- XP é **acumulado historicamente** — nunca reseta
- Desmarcar um treino **reverte** os +10 XP
- Se o utilizador desmarcar um treino com XP já gasto, `xpAvailable` pode ficar negativo — é permitido com aviso visual
- Cada evento de XP é **idempotente** — chave determinística `workout:{date}` previne duplicação
- XP é auditável via subcoleção `xpEvents` (append-only, imutável)

### Estrutura Firestore — Campos adicionados em `users/{uid}`
```
xpTotal: number        // total histórico acumulado
xpSpent: number        // total gasto na loja
xpAvailable: number    // = xpTotal - xpSpent (mantido via increment() atómico)
```

### Subcoleção `users/{uid}/xpEvents/{eventKey}`
```
eventKey: string       // "workout:2026-04-15" | "rank_bonus:2026-03" | "purchase:{id}"
type: "workout" | "rank_bonus" | "purchase" | "reversal"
amount: number         // positivo = ganho, negativo = gasto/reversão
createdAt: Timestamp
meta: { date?, month?, position?, humiliationId? }
```

---

## Ranking Mensal e Elegibilidade

### Fecho mensal
- Disparado pelo **primeiro utilizador que abre a app num novo mês** (transação Firestore com guarda idempotente)
- Gera snapshot imutável em `monthlyRankings/{yearMonth}` com posições e bónus atribuídos
- Constrói matriz de elegibilidade `monthlyRankings/{yearMonth}/pairs/{senderUid}_{recipientUid}` para cada par onde A treinou mais dias que B

### Regra de elegibilidade
> A só pode humilhar B se, num mês **já encerrado**, A treinou **mais dias** que B — e ambos são amigos.

- O mês corrente **nunca** confere elegibilidade (apenas meses encerrados)
- Validado via documento `pairs` (O(1), server-side nas Firestore Rules)

### Estrutura `monthlyRankings/{yearMonth}`
```
yearMonth: string
closedAt: Timestamp
participants: [{ uid, displayName, workoutCount, position, xpBonusAwarded }]
```

### Estrutura `monthlyRankings/{yearMonth}/pairs/{A}_{B}`
```
senderUid: string
recipientUid: string
senderPosition: number
recipientPosition: number
// documento só existe se senderPosition < recipientPosition
```

---

## Loja de Humilhações

### Categorias e Itens

| Categoria | Custo | Exemplos |
|-----------|-------|---------|
| **Alcunhas** | 50–150 XP | "treina fofo", "rei do cardio suave", "atleta de segunda", "músculo de decoração", "levanta palhinhas" |
| **Foto de perfil** | 200–400 XP | Substitui a foto por emoji: 🏋️ halter leve, 🥄 colher, 🐢 tartaruga, 😴 a dormir, 🪶 pena |
| **Combinado** | 500+ XP | Alcunha + foto alterada simultaneamente |

### Regras de compra
- Só quem ficou **à frente** no ranking mensal encerrado pode comprar
- Máx **1 humilhação ativa** por par sender→recipient por mês
- Sem fotos físicas, sem exercícios, sem notificações push

### Transação de compra (cliente)
```
runTransaction:
  1. lê users/{senderUid} → valida xpAvailable >= item.xpCost
  2. lê pairs/{sender}_{recipient} → valida elegibilidade
  3. cria humiliations/{newId} com itemSnapshot congelado
  4. incrementa xpSpent, decrementa xpAvailable
  5. cria xpEvents/purchase:{newId}
```

### Estrutura `humiliations/{humiliationId}`
```
senderUid: string
recipientUid: string
yearMonth: string
itemId: string
itemSnapshot: { title, description, xpCost, category, emoji? }
createdAt: Timestamp
senderDisplayName: string
recipientDisplayName: string
```

---

## Privacidade das Humilhações

### Firestore Rules (ponto crítico)
```
match /humiliations/{id} {
  allow read:   if request.auth.uid == resource.data.senderUid
                || request.auth.uid == resource.data.recipientUid;
  allow create: if request.auth.uid == resource.data.senderUid
                && validaPar() && validaXP() && validaElegibilidade();
  allow update: if false;
  allow delete: if false;
}
```

- Humilhações **nunca podem ser apagadas**
- Terceiros são **bloqueados a nível de servidor** — não basta filtrar no cliente

---

## Banner de Humilhação Recebida

### Comportamento (exibição rotativa)
- Utilizador pode ter **N humilhações ativas** de amigos diferentes
- A cada **abertura da app** → exibe sempre 1 humilhação (nunca some antes de expirar)
- Alterna entre os remetentes a cada abertura — sem repetir o mesmo seguido enquanto houver outros
- Utilizador fecha o banner → fecha para aquela **sessão apenas**, não remove a humilhação
- Na próxima abertura → mostra a próxima na rotação
- Humilhação só expira no **fim do mês** em que foi enviada
- Se só houver **1 humilhação ativa** → mostra sempre a mesma até expirar

### Exemplo de fluxo (2 humilhações)
```
Abriu app → mostra humilhação do João  (rotação: posição 0)
Fechou    → guarda "última mostrada: João" em localStorage
Abriu app → mostra humilhação da Maria (rotação: posição 1)
Fechou    → guarda "última mostrada: Maria"
Abriu app → mostra humilhação do João  (volta ao início da rotação)
...        → continua a rodar até fim do mês
```

### Exemplo de fluxo (1 humilhação)
```
Abriu app → mostra humilhação do João
Fechou    → fecha para esta sessão
Abriu app → mostra humilhação do João (sempre, até expirar)
```

### localStorage
```
key: "humiliation-last-shown"
value: "hum_abc123"   // ID da última humilhação mostrada
```

### Hook `use-humiliations-inbox`
1. Busca todas as humilhações ativas do utilizador (Firestore, query por `recipientUid`, filtradas por `yearMonth` corrente)
2. Lê `humiliation-last-shown` do `localStorage`
3. Determina a próxima na rotação (índice seguinte ao último mostrado)
4. Exibe essa humilhação no banner
5. Ao fechar → atualiza `humiliation-last-shown` no `localStorage`

---

## Componentes de UI

### Novos componentes
| Componente | Descrição |
|------------|-----------|
| `components/xp-badge.tsx` | Badge compacto com XP disponível no header |
| `components/shop/shop-dialog.tsx` | Modal com grid de itens da loja, filtro por categoria |
| `components/shop/shop-item-card.tsx` | Card individual de item |
| `components/shop/target-selector.tsx` | Seletor de amigo elegível (filtrado por `pairs`) |
| `components/shop/purchase-confirm-dialog.tsx` | Confirmação de compra com custo em XP |
| `components/humiliations/humiliation-banner.tsx` | Banner de humilhação recebida com botão fechar |
| `components/xp-history-dialog.tsx` | Histórico de eventos de XP (auditoria) |

### Alterações a componentes existentes
| Componente | Alteração |
|------------|-----------|
| `components/calendar.tsx` | Integrar `awardWorkoutXp` / `reverseWorkoutXp` no toggle de data |
| `components/friend-ranking.tsx` | Badge de XP bónus por posição + botão "Loja" |
| `app/page.tsx` | Adicionar `XpBadge` e `HumiliationBanner` no topo |

### Novos hooks e libs
| Arquivo | Responsabilidade |
|---------|-----------------|
| `lib/xp-config.ts` | Constantes de XP |
| `lib/xp.ts` | `awardWorkoutXp`, `reverseWorkoutXp`, `awardMonthlyBonus` |
| `lib/shop-catalog.ts` | Catálogo estático de itens |
| `lib/shop.ts` | `purchaseHumiliation`, `fetchEligibleTargets` |
| `lib/monthly-ranking.ts` | `closeMonthIfNeeded`, `computeMonthRanking`, `buildPairsMatrix` |
| `hooks/use-xp.ts` | Subscrição em tempo real ao XP do utilizador |
| `hooks/use-humiliations-inbox.ts` | Query + lógica de aleatoriedade + localStorage |
| `hooks/use-eligible-targets.ts` | Amigos que o utilizador pode humilhar este mês |

---

## Fases de Implementação

### Fase 1 — Fundação XP
1. Criar `lib/xp-config.ts` com constantes
2. Estender `users/{uid}` com `xpTotal`, `xpSpent`, `xpAvailable` (init a 0 no `ensureUserProfile`)
3. Atualizar Firestore Rules para novos campos
4. Criar `lib/xp.ts` com funções transacionais
5. Integrar XP na `calendar.tsx` (toggle de data)
6. Criar `hooks/use-xp.ts` e `components/xp-badge.tsx`
7. Adicionar `XpBadge` no header

**Entregável**: Utilizadores ganham/perdem XP ao marcar/desmarcar treinos, veem total no header.

---

### Fase 2 — Fecho Mensal e Bónus
1. Criar `lib/monthly-ranking.ts` com `computeMonthRanking` e `closeMonthIfNeeded`
2. Criar Firestore Rules para `monthlyRankings` e `pairs`
3. Invocar `closeMonthIfNeeded` no arranque da app
4. Atribuir bónus de XP via `xpEvents`
5. Exibir bónus de XP na UI do `friend-ranking.tsx`

**Entregável**: Snapshot mensal imutável, bónus atribuídos, matriz de elegibilidade pronta.

---

### Fase 3 — Loja de Humilhações
1. Criar `lib/shop-catalog.ts` com ~15 itens iniciais
2. Criar Firestore Rules para `humiliations` (privacidade estrita)
3. Criar `lib/shop.ts` com `purchaseHumiliation`
4. Criar `hooks/use-eligible-targets.ts`
5. Criar componentes de loja (`shop-dialog`, `shop-item-card`, `target-selector`, `purchase-confirm-dialog`)
6. Adicionar botão "Loja" na página de ranking

**Entregável**: Utilizadores podem comprar humilhações. Efeitos visuais (alcunha/emoji) aplicados.

---

### Fase 4 — Banner de Humilhação Recebida
1. Criar `hooks/use-humiliations-inbox.ts` (Firestore + localStorage + aleatoriedade)
2. Criar `components/humiliations/humiliation-banner.tsx`
3. Integrar banner no arranque da app (`app/page.tsx`)
4. Persistir estado dispensado em `localStorage`

**Entregável**: Destinatários veem humilhações de forma aleatória a cada abertura da app.

---

## Decisões Tomadas

| Questão | Decisão |
|---------|---------|
| Bónus mensal | Por círculo de amigos (posição relativa ao grupo) |
| Desmarcar com XP gasto | Permitido — exibe aviso de XP negativo |
| Cloud Functions | Não — tudo no cliente via transações Firestore |
| Rate limit | Máx 1 humilhação ativa por par sender→recipient por mês |
| Item repetível | Não — uma humilhação ativa por par por mês |
| Tarefas físicas | Removidas — apenas efeitos digitais |
| Push notifications | Removidas |

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Fecho mensal duplicado por múltiplos clientes | Transação com guarda idempotente — aborta se `monthlyRankings/{yearMonth}` já existir |
| `xpAvailable` dessincronizado | Usar sempre `increment()` atómico, nunca escrever valor absoluto |
| Humilhação visível a terceiros por bug de query | Firestore Rules são a última linha de defesa — nunca confiar apenas no filtro de query |
| Conteúdo ofensivo | Catálogo 100% curado, sem inputs livres de texto |

---

## Arquivos-Chave

- [`lib/friends.ts`](../lib/friends.ts) — estender `ensureUserProfile` com campos de XP
- [`components/calendar.tsx`](../components/calendar.tsx) — integração XP no toggle
- [`components/friend-ranking.tsx`](../components/friend-ranking.tsx) — bónus + botão Loja
- [`app/page.tsx`](../app/page.tsx) — header com XP badge e banner
- `firestore.rules` — expansão crítica de segurança
