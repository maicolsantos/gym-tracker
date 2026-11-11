import { test, expect } from "@playwright/test"
import { loginAsTestUser } from "./helpers/auth"

test.describe("Módulo de Amigos e Ranking (/friends)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test("deve navegar para a página de amigos pelo cabeçalho", async ({ page }) => {
    const friendsLink = page.getByRole("link", { name: "Amigos" })
    await expect(friendsLink).toBeVisible()
    await friendsLink.click()

    await expect(page).toHaveURL(/\/friends/)
    await expect(page.getByRole("heading", { name: "Amigos" })).toBeVisible()
  })

  test("deve permitir alternar entre as abas Ranking, Adicionar e Meu Código", async ({ page }) => {
    await page.goto("/friends")
    await expect(page.getByRole("heading", { name: "Amigos" })).toBeVisible()

    // Aba Meu Código
    const codeTab = page.getByRole("tab", { name: "Meu Código" })
    await expect(codeTab).toBeVisible()
    await codeTab.click()
    await expect(page.getByText("Partilha este código com os teus amigos")).toBeVisible()
    await expect(page.getByRole("button", { name: "Copiar código" })).toBeVisible()

    // Aba Adicionar
    const addTab = page.getByRole("tab", { name: "Adicionar" })
    await expect(addTab).toBeVisible()
    await addTab.click()
    await expect(page.getByLabel("Código do amigo")).toBeVisible()
    await expect(page.getByRole("button", { name: "Adicionar", exact: true })).toBeVisible()

    // Aba Ranking
    const rankingTab = page.getByRole("tab", { name: "Ranking" })
    await expect(rankingTab).toBeVisible()
    await rankingTab.click()
    await expect(page.getByRole("button", { name: /Loja/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Histórico/i })).toBeVisible()
  })

  test("deve abrir a Loja de Humilhações e navegar entre as categorias", async ({ page }) => {
    await page.goto("/friends")
    await expect(page.getByRole("heading", { name: "Amigos" })).toBeVisible()

    const shopBtn = page.getByRole("button", { name: /Loja/i })
    await expect(shopBtn).toBeVisible()
    await shopBtn.click()

    // Modal da loja deve abrir
    await expect(page.getByRole("heading", { name: "Loja de Humilhações" })).toBeVisible()
    await expect(page.getByText(/XP disponível/i)).toBeVisible()

    // Categoria Foto de Perfil (Avatares)
    const avatarTab = page.getByRole("button", { name: "Foto de Perfil" })
    await expect(avatarTab).toBeVisible()
    await avatarTab.click()
    await expect(page.getByText("Halter Leve")).toBeVisible()

    // Categoria Combinados (Combos)
    const comboTab = page.getByRole("button", { name: "Combinados" })
    await expect(comboTab).toBeVisible()
    await comboTab.click()
    await expect(page.getByText("Fofo com Colher")).toBeVisible()

    // Volta para Apelidos
    const nicknameTab = page.getByRole("button", { name: "Apelidos" })
    await expect(nicknameTab).toBeVisible()
    await nicknameTab.click()
    await expect(page.getByText("Treina Fofo")).toBeVisible()

    // Fecha o modal pressionando Escape
    await page.keyboard.press("Escape")
    await expect(page.getByRole("heading", { name: "Loja de Humilhações" })).not.toBeVisible()
  })

  test("deve acumular XP ao marcar treinos e permitir selecionar item na loja", async ({ page }) => {
    // Primeiro marca 2 treinos no calendário para acumular 100 XP
    await page.goto("/")
    await expect(page.getByTestId("current-month-year")).toBeVisible()

    const day1Btn = page.getByTestId("calendar-day-1")
    await day1Btn.click()
    const day2Btn = page.getByTestId("calendar-day-2")
    await day2Btn.click()

    // Navega para a página de amigos
    await page.goto("/friends")
    await expect(page.getByRole("heading", { name: "Amigos" })).toBeVisible()

    // Abre a loja
    const shopBtn = page.getByRole("button", { name: /Loja/i })
    await expect(shopBtn).toBeVisible()
    await shopBtn.click()

    await expect(page.getByRole("heading", { name: "Loja de Humilhações" })).toBeVisible()
    // Deve exibir saldo positivo disponível
    await expect(page.getByText(/[1-9]\d* XP disponível/i)).toBeVisible()

    // O item "Treina Fofo" (50 XP) deve estar habilitado para compra
    const itemCard = page.locator("button").filter({ hasText: "Treina Fofo" })
    await expect(itemCard).toBeEnabled()
    await itemCard.click()

    // Avança para a etapa 2 "Escolhe o alvo"
    await expect(page.getByText("Escolhe o alvo")).toBeVisible()
    await expect(page.getByText("Treina Fofo")).toBeVisible()

    // Testa o botão de voltar para a listagem
    const backBtn = page.getByRole("button", { name: "Voltar" })
    await expect(backBtn).toBeVisible()
    await backBtn.click()

    // Retorna para o catálogo de itens
    await expect(page.getByText("Treina Fofo")).toBeVisible()
    await expect(page.getByText("Escolhe o alvo")).not.toBeVisible()

    // Fecha o modal
    await page.keyboard.press("Escape")
    await expect(page.getByRole("heading", { name: "Loja de Humilhações" })).not.toBeVisible()
  })

  test("deve abrir o modal de Histórico de Rankings e exibir temporadas", async ({ page }) => {
    await page.goto("/friends")
    await expect(page.getByRole("heading", { name: "Amigos" })).toBeVisible()

    const historyBtn = page.getByRole("button", { name: /Histórico/i })
    await expect(historyBtn).toBeVisible()
    await historyBtn.click()

    // Modal de Histórico deve abrir
    await expect(page.getByRole("heading", { name: "Histórico de Rankings" })).toBeVisible()

    // Deve conter indicação de histórico ou ano atual
    const currentYear = new Date().getFullYear().toString()
    await expect(page.getByText(new RegExp(currentYear, "i")).first()).toBeVisible()

    // Fecha o modal pressionando Escape
    await page.keyboard.press("Escape")
    await expect(page.getByRole("heading", { name: "Histórico de Rankings" })).not.toBeVisible()
  })
})
