import { test, expect } from "@playwright/test"

test.describe("Autenticação e Páginas Públicas", () => {
  test("deve exibir a tela de login para usuário não autenticado na página inicial", async ({ page }) => {
    await page.goto("/")

    // Aguarda o carregamento inicial (cold start do dev server)
    const heading = page.getByRole("heading", { name: "Tracker de Ginásio" })
    await expect(heading).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Faça login para acompanhar os seus treinos")).toBeVisible()
    await expect(page.getByRole("button", { name: "Continuar com Google" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Política de Privacidade" }).first()).toBeVisible()
  })

  test("deve permitir navegar até a Política de Privacidade a partir do login", async ({ page }) => {
    await page.goto("/")

    const privacyLink = page.getByRole("link", { name: "Política de Privacidade" }).first()
    await expect(privacyLink).toBeVisible()
    await privacyLink.click()

    await expect(page).toHaveURL(/\/privacidade/)
    await expect(page.getByRole("heading", { name: "Política de Privacidade" })).toBeVisible()
    await expect(page.getByText("Tracker de Ginásio", { exact: false }).first()).toBeVisible()
  })

  test("deve permitir voltar da Política de Privacidade para a página inicial", async ({ page }) => {
    await page.goto("/privacidade")

    const backLink = page.getByRole("link", { name: "Voltar para a página inicial" })
    await expect(backLink).toBeVisible()
    await backLink.click()

    await expect(page).toHaveURL("/")
    await expect(page.getByRole("heading", { name: "Tracker de Ginásio" })).toBeVisible()
  })

  test("deve realizar login no ambiente emulador e depois efetuar logout com sucesso", async ({ page }) => {
    await page.goto("/")

    // Clica no botão de login de teste
    const e2eBtn = page.getByTestId("e2e-login-button")
    await expect(e2eBtn).toBeVisible({ timeout: 15000 })
    await e2eBtn.click()

    // Confirma que entrou na tela principal logada
    await expect(page.getByRole("link", { name: "Início" })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole("link", { name: "Treinos" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Amigos" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Perfil e Definições" })).toBeVisible()

    // Navega para /profile e efetua logout
    await page.getByRole("link", { name: "Perfil e Definições" }).click()
    await expect(page).toHaveURL(/\/profile/)

    const logoutBtn = page.getByRole("button", { name: "Sair" })
    await expect(logoutBtn).toBeVisible()
    await logoutBtn.click()

    // Confirma retorno para a tela de login
    await expect(page.getByRole("heading", { name: "Tracker de Ginásio" })).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId("e2e-login-button")).toBeVisible()
  })
})
