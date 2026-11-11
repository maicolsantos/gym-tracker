import { expect, type Page } from "@playwright/test"

/**
 * Helper to authenticate a test user via the Firebase Emulator
 * Adheres to guidelines in .claude/agents/e2e-runner.md
 */
export async function loginAsTestUser(page: Page, _name = "Atleta Teste") {
  await page.goto("/")

  const e2eButton = page.getByTestId("e2e-login-button")
  await expect(e2eButton).toBeVisible({ timeout: 15000 })
  await e2eButton.click()

  // Wait for header and main calendar to be rendered
  const homeNav = page.getByRole("link", { name: "Início" })
  await expect(homeNav).toBeVisible({ timeout: 15000 })
}
