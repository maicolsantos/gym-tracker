import { test, expect } from "@playwright/test"
import { loginAsTestUser } from "./helpers/auth"

test.describe("Calendário de Treinos", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test("deve renderizar o calendário e o mês atual após login", async ({ page }) => {
    await expect(page.getByText("Tracker Ginásio", { exact: false }).first()).toBeVisible()
    await expect(page.getByTestId("current-month-year")).toBeVisible()
    await expect(page.getByText("Clique em uma data para marcar/desmarcar o treino")).toBeVisible()
  })

  test("deve navegar entre os meses através dos botões de chevron", async ({ page }) => {
    const monthYearSpan = page.getByTestId("current-month-year")
    const initialText = await monthYearSpan.textContent()

    // Navega para o mês anterior
    const prevBtn = page.getByRole("button", { name: "Mês anterior" })
    await prevBtn.click()

    await expect(monthYearSpan).not.toHaveText(initialText || "")

    // Navega de volta para o mês seguinte
    const nextBtn = page.getByRole("button", { name: "Próximo mês" })
    await nextBtn.click()

    await expect(monthYearSpan).toHaveText(initialText || "")
  })

  test("deve marcar e desmarcar um dia de treino no calendário", async ({ page }) => {
    const dayBtn = page.getByTestId("calendar-day-15")
    await expect(dayBtn).toBeVisible()

    // Marca o dia 15
    await dayBtn.click()
    await expect(dayBtn).toHaveClass(/bg-primary/)

    // Desmarca o dia 15
    await dayBtn.click()
    await expect(dayBtn).not.toHaveClass(/bg-primary text-primary-foreground/)
  })

  test("deve exibir o card de Resumo de Treinos", async ({ page }) => {
    await expect(page.getByText("Resumo de Treinos").first()).toBeVisible()
    await expect(page.getByText(/Total de dias treinados/i).first()).toBeVisible()
    await expect(page.getByText("XP disponível")).toBeVisible()
  })

  test("deve atualizar o resumo histórico anual e o XP ao registrar treino", async ({ page }) => {
    // Marca o dia 10
    const day10Btn = page.getByTestId("calendar-day-10")
    await expect(day10Btn).toBeVisible()
    await day10Btn.click()

    // No card de Resumo de Treinos:
    // O total de dias treinados no ano deve ser de pelo menos 1
    const totalBox = page.getByText(/Total de dias treinados/i).locator("..")
    await expect(totalBox.locator(".text-3xl")).toHaveText("1")

    // A contagem mensal de treinos deve exibir 'treino'
    await expect(page.getByText(/1 treino/i).first()).toBeVisible()
  })
})
