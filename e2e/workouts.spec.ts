import { test, expect } from "@playwright/test"
import { loginAsTestUser } from "./helpers/auth"

test.describe("Módulo de Treinos (/workouts)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test("deve navegar para a página de treinos através do cabeçalho", async ({ page }) => {
    const workoutsLink = page.getByRole("link", { name: "Treinos" })
    await expect(workoutsLink).toBeVisible()
    await workoutsLink.click()

    await expect(page).toHaveURL(/\/workouts/)
    await expect(page.getByRole("heading", { name: "Meus Treinos" })).toBeVisible()
    await expect(page.getByText("Organize suas divisões e controle cargas")).toBeVisible()
  })

  test("deve permitir criar um novo plano de treino personalizado", async ({ page }) => {
    await page.goto("/workouts")
    await expect(page.getByRole("heading", { name: "Meus Treinos" })).toBeVisible()

    // Clica no botão "Novo Plano"
    const newPlanBtn = page.getByRole("button", { name: /Novo Plano/i })
    await expect(newPlanBtn).toBeVisible()
    await newPlanBtn.click()

    // O modal deve estar visível
    await expect(page.getByRole("heading", { name: "Criar Novo Plano de Treino" })).toBeVisible()

    // Preenche nome e descrição
    await page.getByPlaceholder(/Hipertrofia ABCD/i).fill("Treino E2E Hipertrofia")
    await page.getByPlaceholder(/Foco em peitoral/i).fill("Plano de teste automatizado E2E")

    // Submete o formulário
    await page.getByRole("button", { name: "Criar Plano" }).click()

    // O novo plano deve estar ativo na interface
    await expect(page.getByRole("heading", { name: "Treino E2E Hipertrofia" })).toBeVisible()
    await expect(page.getByText("Ativo").first()).toBeVisible()
  })

  test("deve permitir editar o título e descrição do plano ativo", async ({ page }) => {
    await page.goto("/workouts")
    await expect(page.getByRole("heading", { name: "Meus Treinos" })).toBeVisible()

    // Clica no botão com ícone de edição (title="Editar plano")
    const editBtn = page.getByTitle("Editar plano")
    await expect(editBtn).toBeVisible()
    await editBtn.click()

    // Modal de edição abre
    await expect(page.getByRole("heading", { name: "Editar Informações do Plano" })).toBeVisible()

    const titleInput = page.getByPlaceholder(/Nome do plano/i)
    await titleInput.clear()
    await titleInput.fill("Treino Editado com Sucesso")

    await page.getByRole("button", { name: "Salvar Alterações" }).click()

    // O cabeçalho deve exibir o novo título atualizado
    await expect(page.getByRole("heading", { name: "Treino Editado com Sucesso" })).toBeVisible()
  })

  test("deve permitir adicionar exercício através da biblioteca com busca", async ({ page }) => {
    await page.goto("/workouts")
    await expect(page.getByRole("heading", { name: "Meus Treinos" })).toBeVisible()

    // Clica no botão de adicionar exercício
    const addExerciseBtn = page.getByRole("button", { name: /Exercício \(\d+\/\d+\)|Explorar e Adicionar/i }).first()
    await expect(addExerciseBtn).toBeVisible()
    await addExerciseBtn.click()

    // Modal da biblioteca abre
    await expect(page.getByRole("heading", { name: /Biblioteca de Exercícios/i })).toBeVisible()

    // Pesquisa por um exercício ("Supino")
    const searchInput = page.getByPlaceholder(/Pesquisar por nome, músculo/i)
    await searchInput.fill("Supino")

    // Seleciona um exercício clicando no card
    const exerciseCard = page.locator("div.cursor-pointer").filter({ hasText: /Supino/i }).first()
    await expect(exerciseCard).toBeVisible()
    await exerciseCard.click()

    // Confirma adição através do botão no rodapé
    const confirmAddBtn = page.getByRole("button", { name: /Adicionar.*ao Treino/i })
    await expect(confirmAddBtn).toBeVisible()
    await confirmAddBtn.click()

    // O exercício deve estar visível na listagem de treinos
    await expect(page.getByText(/Supino/i).first()).toBeVisible()
  })

  test("deve permitir ajustar carga rápida (+2kg) e remover exercício", async ({ page }) => {
    await page.goto("/workouts")
    await expect(page.getByRole("heading", { name: "Meus Treinos" })).toBeVisible()

    // Ajusta a carga se o botão estiver disponível
    const plusBtn = page.getByTitle("+2kg").first()
    if (await plusBtn.isVisible()) {
      await plusBtn.click()
    }

    // Identifica o nome do primeiro exercício para validar que ele some após remoção
    const firstExerciseHeading = page.locator("h4").first()
    const exerciseName = await firstExerciseHeading.textContent()

    // Remove o primeiro exercício da lista
    const removeBtn = page.getByTitle("Remover exercício").first()
    await expect(removeBtn).toBeVisible()
    await removeBtn.click()

    // O exercício removido não deve mais ser o primeiro
    if (exerciseName) {
      await expect(page.locator("h4").first()).not.toHaveText(exerciseName)
    }
  })

  test("deve operar o cronômetro de descanso (iniciar, pausar, presets e fechar)", async ({ page }) => {
    await page.goto("/workouts")
    await expect(page.getByRole("heading", { name: "Meus Treinos" })).toBeVisible()

    // Abre o cronômetro
    const timerBtn = page.getByRole("button", { name: /Abrir Cronômetro/i })
    await expect(timerBtn).toBeVisible()
    await timerBtn.click()

    // Valida abertura do painel do cronômetro
    await expect(page.getByText("Cronômetro de Descanso")).toBeVisible()

    // Testa preset rápido (ex: 30s)
    const preset30 = page.getByRole("button", { name: "30s" })
    await expect(preset30).toBeVisible()
    await preset30.click()

    // Deve iniciar a contagem e exibir botão Pausar
    const pauseBtn = page.getByRole("button", { name: /Pausar/i })
    await expect(pauseBtn).toBeVisible()
    await pauseBtn.click()

    // Após pausar, deve exibir botão Iniciar específico do cronômetro
    const resumeBtn = page.getByRole("button", { name: "Iniciar", exact: true })
    await expect(resumeBtn).toBeVisible()

    // Adiciona 15 segundos
    const add15Btn = page.getByRole("button", { name: /15s/i })
    await expect(add15Btn).toBeVisible()
    await add15Btn.click()

    // Fecha o cronômetro (filtra o botão de fechar visível)
    const closeBtn = page.getByTitle("Fechar").filter({ visible: true }).first()
    await expect(closeBtn).toBeVisible()
    await closeBtn.click()

    // Botão de abrir cronômetro volta a ficar disponível
    await expect(page.getByRole("button", { name: /Abrir Cronômetro/i })).toBeVisible()
  })

  test("deve gerenciar o ciclo de treino (iniciar treino e concluir)", async ({ page }) => {
    await page.goto("/workouts")
    await expect(page.getByRole("heading", { name: "Meus Treinos" })).toBeVisible()

    // Aguarda carregar o botão de iniciar treino com auto-wait
    const startBtn = page.getByRole("button", { name: "Iniciar Treino" })
    await expect(startBtn).toBeVisible()
    await startBtn.click()

    // Indicador de "Em andamento" deve ser exibido
    await expect(page.getByText("Em andamento")).toBeVisible()

    // Conclui o treino
    const completeBtn = page.getByRole("button", { name: "Concluir Treino" })
    await expect(completeBtn).toBeVisible()
    await completeBtn.click()

    // Status muda para Concluído hoje
    await expect(page.getByText(/Concluído Hoje/i).first()).toBeVisible()
  })

  test("deve permitir alternar e excluir um plano no gerenciador", async ({ page }) => {
    await page.goto("/workouts")
    await expect(page.getByRole("heading", { name: "Meus Treinos" })).toBeVisible()

    // Cria um plano secundário para teste de exclusão
    const newPlanBtn = page.getByRole("button", { name: /Novo Plano/i })
    await newPlanBtn.click()
    await page.getByPlaceholder(/Hipertrofia ABCD/i).fill("Plano Descartável E2E")
    await page.getByRole("button", { name: "Criar Plano" }).click()
    await expect(page.getByRole("heading", { name: "Plano Descartável E2E" })).toBeVisible()

    // Abre o seletor de planos
    const switchBtn = page.getByRole("button", { name: /Planos \(\d+\/\d+\)/i })
    await switchBtn.click()
    await expect(page.getByRole("heading", { name: "Seus Planos de Treino" })).toBeVisible()

    // Alterna para outro plano clicando nele
    const otherPlan = page.locator("div.cursor-pointer").filter({ hasText: /Hipertrofia ABC|Treino/i }).first()
    await otherPlan.click()

    // Abre novamente o seletor
    await page.getByRole("button", { name: /Planos \(\d+\/\d+\)/i }).click()
    await expect(page.getByRole("heading", { name: "Seus Planos de Treino" })).toBeVisible()

    // Exclui especificamente o plano descartável através do botão de lixeira do seu card
    const planCard = page.locator("div.cursor-pointer").filter({ hasText: "Plano Descartável E2E" })
    const deleteBtn = planCard.getByTitle("Excluir plano")
    await expect(deleteBtn).toBeVisible()
    await deleteBtn.click()

    // O plano descartável deve sumir da lista do modal
    await expect(page.getByText("Plano Descartável E2E")).not.toBeVisible()
  })
})
