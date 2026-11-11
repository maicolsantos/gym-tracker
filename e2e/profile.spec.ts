import { test, expect } from "@playwright/test"
import { loginAsTestUser } from "./helpers/auth"

test.describe("Módulo de Perfil e Definições (/profile)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test("deve renderizar os dados do utilizador e a seção de conquistas", async ({ page }) => {
    await page.goto("/profile")

    await expect(page.getByText("Atleta Teste").first()).toBeVisible()
    await expect(page.getByText("Definições").first()).toBeVisible()
    await expect(page.getByText("Conquistas").first()).toBeVisible()
  })

  test("deve alternar o tema visual entre Claro e Escuro", async ({ page }) => {
    await page.goto("/profile")
    await expect(page.getByText("Definições").first()).toBeVisible()

    // Alterna para o tema escuro
    const darkRadio = page.getByRole("radio", { name: "Escuro" })
    await expect(darkRadio).toBeVisible()
    await darkRadio.click()

    await expect(page.locator("html")).toHaveClass(/dark/)

    // Alterna de volta para o tema claro
    const lightRadio = page.getByRole("radio", { name: "Claro" })
    await expect(lightRadio).toBeVisible()
    await lightRadio.click()

    await expect(page.locator("html")).not.toHaveClass(/dark/)
  })
})
