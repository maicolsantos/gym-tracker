/**
 * Script para sincronizar e traduzir o catálogo da ExerciseGymGifsDB para PT-BR.
 * Execução: bun scripts/sync-exercises-pt.ts
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"

interface RawExercise {
  id: string
  slug: string
  name: string
  muscle: string
  bodyPart: string
  equipment: string
  category: string
  secondaryMuscles: string[]
  instructions: string[]
  file: string
  gifUrl: string
  thumbUrl: string
}

interface RawData {
  count: number
  exercises: RawExercise[]
}

export interface CatalogExercise {
  id: string
  slug: string
  name: string
  originalName: string
  muscle: string
  muscleLabel: string
  equipment: string
  equipmentLabel: string
  bodyPart: string
  category: string
  secondaryMuscles: string[]
  instructions: string[]
  gifUrl: string
  thumbUrl: string
}

const MUSCLE_LABELS: Record<string, string> = {
  pectorals: "Peitoral",
  chest: "Peitoral",
  lats: "Dorsais / Costas",
  "upper-back": "Costas (Superior)",
  spine: "Lombar",
  delts: "Ombros (Deltoides)",
  shoulders: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  quads: "Quadríceps",
  hamstrings: "Posterior de Coxa",
  glutes: "Glúteos",
  calves: "Panturrilhas",
  abs: "Abdômen",
  core: "Core / Abdômen",
  adductors: "Adutores",
  abductors: "Abdutores",
  forearms: "Antebraços",
  traps: "Trapézio",
  "serratus-anterior": "Serrátil",
  "levator-scapulae": "Elevador da Escápula",
  cardio: "Cardio",
}

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Barra",
  dumbbell: "Halteres",
  cable: "Polia",
  machine: "Máquina",
  lever: "Máquina Articulada",
  bodyweight: "Peso Corporal",
  band: "Faixa / Elástico",
  smith: "Máquina Smith",
  kettlebell: "Kettlebell",
  "ez-bar": "Barra W",
  sled: "Trenó",
  other: "Outro",
}

const INSTRUCTIONS_MAP: Record<string, string> = {
  "Ajusta la máquina a tu medida y selecciona la carga.":
    "Ajuste a máquina para sua postura e selecione a carga adequada.",
  "Activa los abductores antes de iniciar el movimiento.":
    "Ative os abdutores antes de iniciar o movimento.",
  "Realiza el movimiento de forma controlada manteniendo la técnica.":
    "Realize o movimento de forma controlada mantendo a técnica correta.",
  "Vuelve a la posición inicial controlando la fase excéntrica.":
    "Retorne à posição inicial controlando a fase excêntrica da descida.",
  "Mantén la respiración: exhala en el esfuerzo, inhala al volver.":
    "Mantenha a respiração: expire na fase de esforço e inspire ao retornar.",
  "Fija la banda elástica y mantén la tensión inicial.":
    "Fixe o elástico e mantenha uma leve tensão inicial.",
  "Adopta la postura inicial con buena alineación corporal.":
    "Adote a postura inicial mantendo o alinhamento corporal.",
  "Activa el core antes de iniciar el movimiento.":
    "Ative o abdômen e core antes de iniciar o movimento.",
  "Lleva el cuerpo a la posición de estiramiento de el core.":
    "Posicione o corpo na extensão de alongamento do core.",
  "Mantén entre 20 y 40 segundos respirando de forma profunda.":
    "Mantenha a posição por 20 a 40 segundos respirando profundamente.",
  "Vuelve a la posición inicial lentamente y repite si lo deseas.":
    "Retorne à posição inicial devagar e repita a série.",
  "Carga el peso adecuado en la barra y adopta la postura inicial.":
    "Coloque a carga adequada na barra e assuma a postura inicial com pegada firme.",
  "Ajusta la polea a la altura indicada y selecciona el peso.":
    "Ajuste a altura da polia e selecione o peso desejado.",
  "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.":
    "Segure os halteres com carga adequada mantendo a pegada firme.",
  "Coge la kettlebell con un peso adecuado y adopta la postura.":
    "Segure o kettlebell com carga confortável e adote a posição inicial.",
  "Prepara el equipo y adopta la postura inicial.":
    "Prepare o equipamento e ajuste sua postura inicial.",
  "Coloca la barra en la máquina Smith a la altura adecuada.":
    "Posicione a barra da máquina Smith na altura indicada e trave com segurança.",
  "Lleva el cuerpo a la posición de estiramiento de los aductores.":
    "Leve o corpo à posição de alongamento dos adutores.",
  "Activa los aductores antes de iniciar el movimiento.":
    "Ative os adutores da coxa antes de iniciar o movimento.",
  "Activa los bíceps antes de iniciar el movimiento.":
    "Ative os bíceps e contraia na subida do movimento.",
  "Carga la barra Z con un peso adecuado y agárrala con firmeza.":
    "Coloque os pesos na barra W (barra EZ) e segure com pegada firme.",
  "Activa los gemelos antes de iniciar el movimiento.":
    "Ative as panturrilhas e faça a extensão completa do tornozelo.",
  "Lleva el cuerpo a la posición de estiramiento de los gemelos.":
    "Alongue as panturrilhas sentindo a extensão controlada.",
  "Realiza una breve flexión para acumular tensión.":
    "Faça uma flexão breve para concentrar a energia elástica muscular.",
  "Ejecuta el movimiento de forma explosiva y aterriza con control.":
    "Execute o movimento de forma explosiva e amorteça aterrissando com controle.",
  "Aterriza suave amortiguando con piernas y core, y encadena la siguiente repetición.":
    "Aterrisse suavemente amortecendo com pernas e abdômen para a próxima repetição.",
  "Mantén un ritmo constante adaptado a tu nivel.":
    "Mantenha um ritmo cadenciado e constante adequado ao seu nível.",
  "Activa el core y mantén una postura erguida durante todo el ejercicio.":
    "Mantenha o abdômen contraído e a postura ereta durante todo o exercício.",
  "Continúa el tiempo o las repeticiones planificadas.":
    "Continue pelo tempo estipulado ou repetições planejadas.",
  "Activa los hombros antes de iniciar el movimiento.":
    "Ative os deltoides (ombros) mantendo as escápulas estáveis.",
  "Lleva el cuerpo a la posición de estiramiento de los hombros.":
    "Alongue a região dos ombros com respiração controlada.",
  "Activa los antebrazos antes de iniciar el movimiento.":
    "Ative a musculatura dos antebraços e punhos firmes.",
  "Lleva el cuerpo a la posición de estiramiento de los antebrazos.":
    "Alongue os flexores e extensores do antebraço.",
  "Activa los glúteos antes de iniciar el movimiento.":
    "Ative os glúteos e contraia firmemente no topo do movimento.",
  "Lleva el cuerpo a la posición de estiramiento de los glúteos.":
    "Alongue a musculatura dos glúteos com respiração profunda.",
  "Activa los isquiotibiales antes de iniciar el movimiento.":
    "Ative os posteriores de coxa (isquiotibiais) de forma controlada.",
  "Lleva el cuerpo a la posición de estiramiento de los isquiotibiales.":
    "Alongue os posteriores de coxa preservando a curvatura da lombar.",
  "Activa los dorsales antes de iniciar el movimiento.":
    "Ative os dorsais (costas) e mantenha a retração escapular.",
  "Lleva el cuerpo a la posición de estiramiento de los dorsales.":
    "Alongue a dorsal com os braços estendidos e respiração suave.",
  "Lleva el cuerpo a la posición de estiramiento de el elevador de la escápula.":
    "Alongue o elevador da escápula inclinando a cabeça suavemente.",
  "Activa el pectoral antes de iniciar el movimiento.":
    "Ative o peitoral e estabilize os ombros no banco/chão.",
  "Lleva el cuerpo a la posición de estiramiento de el pectoral.":
    "Alongue o peitoral abrindo a caixa torácica com moderação.",
  "Lleva el cuerpo a la posición de estiramiento de los cuádriceps.":
    "Alongue o quadríceps puxando a perna com calma e estabilidade.",
  "Activa los cuádriceps antes de iniciar el movimiento.":
    "Ative os quadríceps e empurre com força firme pelas solas dos pés.",
  "Activa el serrato anterior antes de iniciar el movimiento.":
    "Ative o serrátil anterior mantendo o controle da cintura escapular.",
  "Activa la zona lumbar antes de iniciar el movimiento.":
    "Ative a musculatura lombar mantendo o alinhamento da coluna.",
  "Lleva el cuerpo a la posición de estiramiento de la zona lumbar.":
    "Alongue a região lombar relaxando suavemente a tensão das costas.",
  "Activa los trapecios antes de iniciar el movimiento.":
    "Ative os trapézios elevando com controle sem girar os ombros.",
  "Activa los tríceps antes de iniciar el movimiento.":
    "Ative os tríceps e concentre a extensão no cotovelo sem abrir os braços.",
  "Lleva el cuerpo a la posición de estiramiento de los tríceps.":
    "Alongue os tríceps flexionando o cotovelo atrás da cabeça.",
  "Activa la espalda alta antes de iniciar el movimiento.":
    "Ative a parte superior das costas e aproxime as escápulas.",
  "Lleva el cuerpo a la posición de estiramiento de la espalda alta.":
    "Alongue a parte superior das costas projetando os braços à frente.",
}

// Mapeamentos específicos de nomes muito conhecidos nas academias brasileiras
const SPECIFIC_EXERCISE_NAMES: Record<string, string> = {
  "abductors/lever-seated-hip-abduction": "Cadeira Abdutora",
  "abductors/resistance-band-seated-hip-abduction": "Cadeira Abdutora com Elástico",
  "adductors/lever-seated-hip-adduction": "Cadeira Adutora",
  "pectorals/lever-seated-fly": "Voador / Crucifixo na Máquina",
  "triceps/cable-pushdown-with-rope-attachment": "Tríceps Corda na Polia",
  "triceps/barbell-lying-triceps-extension-skull-crusher": "Tríceps Testa com Barra",
  "lats/cable-lat-pulldown-full-range-of-motion": "Puxada Frontal na Polia",
  "upper-back/barbell-bent-over-row": "Remada Curvada com Barra",
  "upper-back/cable-seated-row": "Remada Baixa na Polia",
  "quads/barbell-wide-squat": "Agachamento Livre com Barra",
  "biceps/barbell-curl": "Rosca Direta com Barra",
  "biceps/ez-barbell-curl": "Rosca Direta com Barra W",
  "biceps/dumbbell-biceps-curl": "Rosca Direta com Halteres",
  "biceps/dumbbell-hammer-curl": "Rosca Martelo com Halteres",
  "biceps/dumbbell-incline-biceps-curl": "Rosca Inclinada com Halteres",
  "biceps/dumbbell-concentration-curl": "Rosca Concentrada com Haltere",
  "biceps/cable-biceps-curl": "Rosca Direta na Polia",
  "biceps/cable-hammer-curl-with-rope": "Rosca Martelo na Polia com Corda",
  "biceps/dumbbell-preacher-curl": "Rosca Scott com Halteres",
  "biceps/barbell-preacher-curl": "Rosca Scott com Barra",
  "biceps/ez-bar-preacher-curl": "Rosca Scott com Barra W",
  "biceps/lever-preacher-curl": "Rosca Scott na Máquina",
  "biceps/cable-preacher-curl": "Rosca Scott na Polia",
  "biceps/cable-overhead-curl": "Rosca Bíceps na Polia Alta (Duplo Bíceps)",
  "biceps/chin-up": "Barra Fixa Supinada (Chin-Up)",
  "triceps/cable-triceps-pushdown": "Tríceps Polia (Pushdown)",
  "triceps/cable-rope-triceps-pushdown": "Tríceps Corda na Polia",
  "triceps/cable-triceps-extension": "Tríceps Francês na Polia",
  "triceps/dumbbell-triceps-extension": "Tríceps Francês com Halteres",
  "triceps/dumbbell-kickback": "Tríceps Coice com Halteres",
  "triceps/cable-kickback": "Tríceps Coice na Polia",
  "triceps/dips": "Mergulho nas Paralelas",
  "triceps/bench-dips": "Tríceps no Banco",
  "triceps/barbell-skull-crusher": "Tríceps Testa com Barra",
  "triceps/ez-bar-skull-crusher": "Tríceps Testa com Barra W",
  "triceps/dumbbell-skull-crusher": "Tríceps Testa com Halteres",
  "pectorals/barbell-bench-press": "Supino Reto com Barra",
  "pectorals/dumbbell-bench-press": "Supino Reto com Halteres",
  "pectorals/barbell-incline-bench-press": "Supino Inclinado com Barra",
  "pectorals/dumbbell-incline-bench-press": "Supino Inclinado com Halteres",
  "pectorals/barbell-decline-bench-press": "Supino Declinado com Barra",
  "pectorals/dumbbell-decline-bench-press": "Supino Declinado com Halteres",
  "pectorals/lever-chest-press": "Supino Máquina",
  "pectorals/cable-crossover": "Crossover na Polia",
  "pectorals/cable-fly": "Crucifixo na Polia",
  "pectorals/dumbbell-fly": "Crucifixo Reto com Halteres",
  "pectorals/dumbbell-incline-fly": "Crucifixo Inclinado com Halteres",
  "pectorals/dumbbell-decline-fly": "Crucifixo Declinado com Halteres",
  "pectorals/lever-pec-deck-fly": "Voador / Peck Deck",
  "pectorals/push-up": "Flexão de Braço",
  "delts/dumbbell-lateral-raise": "Elevação Lateral com Halteres",
  "delts/cable-lateral-raise": "Elevação Lateral na Polia",
  "delts/dumbbell-front-raise": "Elevação Frontal com Halteres",
  "delts/barbell-front-raise": "Elevação Frontal com Barra",
  "delts/cable-front-raise": "Elevação Frontal na Polia",
  "delts/barbell-overhead-press": "Desenvolvimento Militar com Barra",
  "delts/dumbbell-shoulder-press": "Desenvolvimento com Halteres",
  "delts/dumbbell-arnold-press": "Desenvolvimento Arnold com Halteres",
  "delts/lever-shoulder-press": "Desenvolvimento na Máquina",
  "delts/dumbbell-reverse-fly": "Crucifixo Invertido com Halteres",
  "delts/cable-reverse-fly": "Crucifixo Invertido na Polia",
  "delts/lever-reverse-fly": "Crucifixo Invertido na Máquina",
  "delts/face-pull": "Face Pull na Polia",
  "delts/upright-row": "Remada Alta",
  "lats/pull-up": "Barra Fixa Pronada (Pull-Up)",
  "lats/lat-pulldown": "Puxada Frontal na Polia",
  "lats/cable-lat-pulldown": "Puxada Frontal na Polia",
  "lats/lever-lat-pulldown": "Puxada na Máquina",
  "lats/barbell-bent-over-row": "Remada Curvada com Barra",
  "lats/dumbbell-bent-over-row": "Remada Curvada com Halteres",
  "lats/dumbbell-one-arm-row": "Remada Unilateral com Haltere (Serrote)",
  "lats/cable-seated-row": "Remada Baixa na Polia",
  "lats/lever-seated-row": "Remada na Máquina",
  "lats/barbell-t-bar-row": "Remada Cavalinho (Barra T)",
  "lats/dumbbell-pullover": "Pullover com Haltere",
  "lats/cable-pullover": "Pulldown na Polia (Braços Estendidos)",
  "quads/barbell-squat": "Agachamento Livre com Barra",
  "quads/barbell-front-squat": "Agachamento Frontal com Barra",
  "quads/smith-machine-squat": "Agachamento na Máquina Smith",
  "quads/lever-leg-press": "Leg Press 45º / Máquina",
  "quads/lever-leg-extension": "Cadeira Extensora",
  "quads/dumbbell-goblet-squat": "Agachamento Goblet com Haltere",
  "quads/dumbbell-bulgarian-split-squat": "Agachamento Búlgaro com Halteres",
  "quads/barbell-bulgarian-split-squat": "Agachamento Búlgaro com Barra",
  "quads/dumbbell-lunge": "Avanço / Passada com Halteres",
  "quads/barbell-lunge": "Avanço / Passada com Barra",
  "quads/hack-squat": "Agachamento Hack",
  "hamstrings/lever-lying-leg-curl": "Mesa Flexora",
  "hamstrings/lever-seated-leg-curl": "Cadeira Flexora",
  "hamstrings/dumbbell-romanian-deadlift": "Stiff / Romeno com Halteres",
  "hamstrings/barbell-romanian-deadlift": "Stiff / Levantamento Romeno com Barra",
  "hamstrings/barbell-deadlift": "Levantamento Terra com Barra",
  "hamstrings/barbell-sumo-deadlift": "Levantamento Terra Sumô com Barra",
  "hamstrings/good-morning": "Bom Dia (Good Morning)",
  "glutes/barbell-hip-thrust": "Elevação Pélvica com Barra (Hip Thrust)",
  "glutes/dumbbell-hip-thrust": "Elevação Pélvica com Haltere",
  "glutes/cable-kickback": "Glúteo Coice na Polia (Kickback)",
  "glutes/dumbbell-glute-bridge": "Ponte de Glúteos com Haltere",
  "calves/lever-standing-calf-raise": "Panturrilha em Pé na Máquina",
  "calves/lever-seated-calf-raise": "Panturrilha Sentado na Máquina (Gêmeos)",
  "calves/dumbbell-standing-calf-raise": "Panturrilha em Pé com Halteres",
  "calves/barbell-standing-calf-raise": "Panturrilha em Pé com Barra",
  "calves/donkey-calf-raise": "Panturrilha Burrinho (Donkey)",
  "abs/crunch": "Abdominal Crunch",
  "abs/plank": "Prancha Abdominal",
  "abs/hanging-leg-raise": "Elevação de Pernas na Barra",
  "abs/cable-crunch": "Abdominal na Polia Alta (Cable Crunch)",
  "abs/ab-wheel-rollout": "Abdominal com Rodinha (Ab Wheel)",
  "abs/russian-twist": "Russian Twist",
  "abs/side-plank": "Prancha Lateral",
  "traps/barbell-shrug": "Encolhimento de Ombros com Barra",
  "traps/dumbbell-shrug": "Encolhimento de Ombros com Halteres",
  "traps/smith-machine-shrug": "Encolhimento de Ombros na Smith",
}

// Dicionário de termos comuns para tradução inteligente dos nomes restantes
const PHRASE_REPLACEMENTS: [RegExp, string][] = [
  // Movimentos principais
  [/\bAbducción de cadera\b/gi, "Abdução de Quadril"],
  [/\bAducción de cadera\b/gi, "Adução de Quadril"],
  [/\bPress de banca JM\b/gi, "Supino JM"],
  [/\bPress de banca plano\b/gi, "Supino Reto"],
  [/\bPress de banca inclinado\b/gi, "Supino Inclinado"],
  [/\bPress de banca declinado\b/gi, "Supino Declinado"],
  [/\bPress de banca\b/gi, "Supino"],
  [/\bPress de pecho\b/gi, "Supino de Peito"],
  [/\bPress militar\b/gi, "Desenvolvimento Militar"],
  [/\bPress de hombros\b/gi, "Desenvolvimento de Ombros"],
  [/\bPress francés\b/gi, "Tríceps Francês"],
  [/\bJalón al pecho\b/gi, "Puxada Frontal"],
  [/\bJalón trasnuca\b/gi, "Puxada Atrás da Nuca"],
  [/\bJalón\b/gi, "Puxada"],
  [/\bRemo con barra t\b/gi, "Remada Cavalinho (Barra T)"],
  [/\bRemo\b/gi, "Remada"],
  [/\bSentadilla búlgara\b/gi, "Agachamento Búlgaro"],
  [/\bSentadilla frontal\b/gi, "Agachamento Frontal"],
  [/\bSentadilla profunda\b/gi, "Agachamento Profundo"],
  [/\bSentadilla\b/gi, "Agachamento"],
  [/\bExtensiones de piernas\b/gi, "Extensão de Pernas"],
  [/\bExtensión de piernas\b/gi, "Extensão de Pernas"],
  [/\bExtensiones de tríceps\b/gi, "Extensão de Tríceps"],
  [/\bExtensión de tríceps\b/gi, "Extensão de Tríceps"],
  [/\bExtensión de cadera\b/gi, "Extensão de Quadril"],
  [/\bExtensiones de cadera\b/gi, "Extensão de Quadril"],
  [/\bExtensión de espalda\b/gi, "Extensão Lombar (Hiperextensão)"],
  [/\bExtensión\b/gi, "Extensão"],
  [/\bExtensiones\b/gi, "Extensões"],
  [/\bElevaciones laterales\b/gi, "Elevação Lateral"],
  [/\bElevación lateral\b/gi, "Elevação Lateral"],
  [/\bElevaciones frontales\b/gi, "Elevação Frontal"],
  [/\bElevación frontal\b/gi, "Elevação Frontal"],
  [/\bElevaciones de talón\b/gi, "Elevação de Panturrilha"],
  [/\bElevación de talones\b/gi, "Elevação de Panturrilha"],
  [/\bElevaciones de gemelos\b/gi, "Elevação de Panturrilha"],
  [/\bElevación de gemelos\b/gi, "Elevação de Panturrilha"],
  [/\bElevaciones de pantorrilla\b/gi, "Elevação de Panturrilha"],
  [/\bElevación de pantorrillas\b/gi, "Elevação de Panturrilha"],
  [/\bElevaciones de piernas\b/gi, "Elevação de Pernas"],
  [/\bElevación de piernas\b/gi, "Elevação de Pernas"],
  [/\bElevaciones de rodillas\b/gi, "Elevação de Joelhos"],
  [/\bElevación de rodillas\b/gi, "Elevação de Joelhos"],
  [/\bElevaciones\b/gi, "Elevações"],
  [/\bElevación\b/gi, "Elevação"],
  [/\bPeso muerto rumano\b/gi, "Levantamento Romeno (Stiff)"],
  [/\bPeso muerto sumo\b/gi, "Levantamento Terra Sumô"],
  [/\bPeso muerto\b/gi, "Levantamento Terra"],
  [/\bFlexión del arquero\b/gi, "Flexão Arqueiro"],
  [/\bFlexión hindú\b/gi, "Flexão Hindu"],
  [/\bFlexión de brazos\b/gi, "Flexão de Braço"],
  [/\bFlexiones de brazos\b/gi, "Flexões de Braço"],
  [/\bFlexiones\b/gi, "Flexões de Braço"],
  [/\bFlexión\b/gi, "Flexão"],
  [/\bFondos en paralelas\b/gi, "Mergulho nas Paralelas"],
  [/\bFondos de tríceps\b/gi, "Tríceps no Banco"],
  [/\bFondos\b/gi, "Mergulho nas Paralelas"],
  [/\bFondo\b/gi, "Mergulho"],
  [/\bDominadas\b/gi, "Barra Fixa"],
  [/\bDominada\b/gi, "Barra Fixa"],
  [/\bAperturas inclinadas\b/gi, "Crucifixo Inclinado"],
  [/\bAperturas declinadas\b/gi, "Crucifixo Declinado"],
  [/\bAperturas planas\b/gi, "Crucifixo Reto"],
  [/\bAperturas\b/gi, "Crucifixo"],
  [/\bApertura\b/gi, "Crucifixo"],
  [/\bEncogimientos de hombros\b/gi, "Encolhimento de Ombros"],
  [/\bEncogimiento de hombros\b/gi, "Encolhimento de Ombros"],
  [/\bEncogimientos\b/gi, "Encolhimento"],
  [/\bEncogimiento\b/gi, "Encolhimento"],
  [/\bEstiramiento\b/gi, "Alongamento"],
  [/\bEstiramientos\b/gi, "Alongamentos"],
  [/\bPuente de glúteos\b/gi, "Ponte de Glúteos"],
  [/\bPuente de glúteo\b/gi, "Ponte de Glúteos"],
  [/\bPuente lateral\b/gi, "Ponte Lateral"],
  [/\bPuente\b/gi, "Ponte"],
  [/\bZancadas\b/gi, "Passada / Avanço"],
  [/\bZancada\b/gi, "Passada / Avanço"],
  [/\bPaseo del granjero\b/gi, "Caminhada do Fazendeiro"],
  [/\bBicicleta aérea\b/gi, "Abdominal Bicicleta"],
  [/\bEmpuje de cadera\b/gi, "Elevação Pélvica (Hip Thrust)"],
  [/\bEmpuje\b/gi, "Empurrão"],
  [/\bGiro de columna\b/gi, "Rotação de Coluna"],
  [/\bGiro ruso\b/gi, "Russian Twist"],
  [/\bGiro\b/gi, "Rotação"],
  [/\bGiros\b/gi, "Rotações"],
  [/\bRueda abdominal\b/gi, "Roda Abdominal"],
  [/\bSalto hacia atrás\b/gi, "Salto para Trás"],
  [/\bSalto hacia adelante\b/gi, "Salto para Frente"],
  [/\bSalto vertical\b/gi, "Salto Vertical"],
  [/\bSalto\b/gi, "Salto"],
  [/\bSaltos\b/gi, "Saltos"],
  [/\bTabla de equilibrio\b/gi, "Prancha de Equilíbrio"],
  [/\bCargada y press\b/gi, "Clean & Press"],
  [/\bCargada\b/gi, "Clean (Cargada)"],
  [/\bArrancada\b/gi, "Snatch (Arranco)"],

  // Roscas / Bíceps
  [/\bCurl de bíceps\b/gi, "Rosca Bíceps"],
  [/\bCurl femoral tumbado\b/gi, "Mesa Flexora"],
  [/\bCurl femoral sentado\b/gi, "Cadeira Flexora"],
  [/\bCurl femoral de pie\b/gi, "Flexora em Pé"],
  [/\bCurl femoral\b/gi, "Mesa/Cadeira Flexora"],
  [/\bCurl de muñeca\b/gi, "Rosca de Punho"],
  [/\bCurl invertido\b/gi, "Rosca Inversa"],
  [/\bCurl predicador\b/gi, "Rosca Scott"],
  [/\bCurl martillo\b/gi, "Rosca Martelo"],
  [/\bCurl concentrado\b/gi, "Rosca Concentrada"],
  [/\bCurl araña\b/gi, "Rosca Spider"],
  [/\bCurl drag\b/gi, "Rosca Drag"],
  [/\bCurl\b/gi, "Rosca"],

  // Equipamentos / Acessórios
  [/\bcon barra z\b/gi, "com Barra W"],
  [/\bcon barra ez\b/gi, "com Barra W"],
  [/\bcon barra hexagonal\b/gi, "com Barra Hexagonal"],
  [/\bcon barra\b/gi, "com Barra"],
  [/\ben barra\b/gi, "na Barra"],
  [/\bcon mancuernas\b/gi, "com Halteres"],
  [/\bcon mancuerna\b/gi, "com Haltere"],
  [/\ben polea alta\b/gi, "na Polia Alta"],
  [/\ben polea baja\b/gi, "na Polia Baixa"],
  [/\ben polea\b/gi, "na Polia"],
  [/\bcon polea\b/gi, "na Polia"],
  [/\ben máquina smith\b/gi, "na Máquina Smith"],
  [/\ben máquina de palanca\b/gi, "na Máquina Articulada"],
  [/\ben máquina\b/gi, "na Máquina"],
  [/\bcon máquina\b/gi, "na Máquina"],
  [/\bcon banda elástica\b/gi, "com Elástico"],
  [/\bcon banda\b/gi, "com Elástico"],
  [/\bcon kettlebell\b/gi, "com Kettlebell"],
  [/\bcon cuerda\b/gi, "com Corda"],
  [/\bcon toalla\b/gi, "com Toalha"],
  [/\bcon disco\b/gi, "com Anilha"],
  [/\bcon discos\b/gi, "com Anilhas"],
  [/\bcon fitball\b/gi, "com Bola Suíça"],
  [/\ben fitball\b/gi, "na Bola Suíça"],
  [/\ben banco plano\b/gi, "no Banco Reto"],
  [/\ben banco inclinado\b/gi, "no Banco Inclinado"],
  [/\ben banco declinado\b/gi, "no Banco Declinado"],
  [/\ben banco\b/gi, "no Banco"],
  [/\ben suelo\b/gi, "no Chão"],
  [/\ben colchoneta\b/gi, "no Colchonete"],
  [/\ben anillas\b/gi, "nas Argolas"],
  [/\ben paralelas\b/gi, "nas Paralelas"],
  [/\ben espaldar\b/gi, "no Espaldar"],
  [/\bcon rodillo\b/gi, "com Rolo de Liberação"],
  [/\bcon rueda\b/gi, "com Roda"],

  // Posições / Variações
  [/\btumbado boca abajo\b/gi, "Deitado de Bruços"],
  [/\btumbado boca arriba\b/gi, "Deitado de Costas"],
  [/\btumbado de lado\b/gi, "Deitado de Lado"],
  [/\btumbado lateral\b/gi, "Deitado Lateral"],
  [/\btumbado\b/gi, "Deitado"],
  [/\bsentado\b/gi, "Sentado"],
  [/\bde pie\b/gi, "em Pé"],
  [/\bde rodillas\b/gi, "Ajoelhado"],
  [/\ben cuadrupedia\b/gi, "em Quatro Apoios"],
  [/\bcolgado\b/gi, "Suspenso na Barra"],
  [/\binclinado\b/gi, "Inclinado"],
  [/\binclinada\b/gi, "Inclinada"],
  [/\bdeclinado\b/gi, "Declinado"],
  [/\bdeclinada\b/gi, "Declinada"],
  [/\bplano\b/gi, "Reto"],
  [/\bplana\b/gi, "Reta"],
  [/\basistido con lanzamiento lateral\b/gi, "Assistido com Impulso Lateral"],
  [/\basistido con lanzamiento\b/gi, "Assistido com Impulso"],
  [/\basistido\b/gi, "Assistido"],
  [/\basistida\b/gi, "Assistida"],
  [/\balternado\b/gi, "Alternado"],
  [/\balternada\b/gi, "Alternada"],
  [/\bunilateral\b/gi, "Unilateral"],
  [/\ba una mano\b/gi, "Unilateral"],
  [/\ba un brazo\b/gi, "Unilateral"],
  [/\ba una pierna\b/gi, "Unilateral"],
  [/\bcon brazo recto\b/gi, "com Braço Estendido"],
  [/\bcon brazos rectos\b/gi, "com Braços Estendidos"],
  [/\bcon pierna recta\b/gi, "com Perna Estendida"],
  [/\bcon piernas rectas\b/gi, "com Pernas Estendidas"],
  [/\bcon rodillas flexionadas\b/gi, "com Joelhos Flexionados"],
  [/\bcon piernas flexionadas\b/gi, "com Pernas Flexionadas"],
  [/\bcon agarre invertido\b/gi, "com Pegada Invertida"],
  [/\bcon agarre ancho\b/gi, "com Pegada Aberta"],
  [/\bcon agarre estrecho\b/gi, "com Pegada Fechada"],
  [/\bcon agarre neutro\b/gi, "com Pegada Neutra"],
  [/\bcon agarre prono\b/gi, "com Pegada Pronada"],
  [/\bcon agarre supino\b/gi, "com Pegada Supinada"],
  [/\bsobre la cabeza\b/gi, "Acima da Cabeça"],
  [/\bhacia adelante\b/gi, "para Frente"],
  [/\bhacia atrás\b/gi, "para Trás"],
  [/\blateral\b/gi, "Lateral"],
  [/\blaterales\b/gi, "Laterais"],
  [/\btrasnuca\b/gi, "Atrás da Nuca"],
  [/\bcon giro\b/gi, "com Rotação"],
  [/\bcon rotación\b/gi, "com Rotação"],

  // Palavras de ligação e termos menores
  [/\bcon\b/gi, "com"],
  [/\ben\b/gi, "em"],
  [/\bbrazo\b/gi, "Braço"],
  [/\bbrazos\b/gi, "Braços"],
  [/\bpierna\b/gi, "Perna"],
  [/\bpiernas\b/gi, "Pernas"],
  [/\brodilla\b/gi, "Joelho"],
  [/\brodillas\b/gi, "Joelhos"],
  [/\bpecho\b/gi, "Peito"],
  [/\bespalda\b/gi, "Costas"],
  [/\bhombro\b/gi, "Ombro"],
  [/\bhombros\b/gi, "Ombros"],
  [/\bcuello\b/gi, "Pescoço"],
  [/\bcabeza\b/gi, "Cabeça"],
  [/\bcadera\b/gi, "Quadril"],
  [/\bcaderas\b/gi, "Quadris"],
  [/\btalón\b/gi, "Calcanhar"],
  [/\btalones\b/gi, "Calcanhares"],
  [/\bmuñeca\b/gi, "Punho"],
  [/\bmuñecas\b/gi, "Punhos"],
  [/\bcodo\b/gi, "Cotovelo"],
  [/\bocdos\b/gi, "Cotovelos"],
  [/\brecta\b/gi, "Estendida"],
  [/\brecto\b/gi, "Estendido"],
  [/\brectas\b/gi, "Estendidas"],
  [/\brectos\b/gi, "Estendidos"],
  [/\bexterno\b/gi, "Externo"],
  [/\bexterna\b/gi, "Externa"],
  [/\binterno\b/gi, "Interno"],
  [/\binterna\b/gi, "Interna"],
]

function formatTitleCase(str: string): string {
  if (!str) return ""
  // Limpeza de vírgulas duplicadas ou espaços
  const cleaned = str
    .replace(/\s*,\s*/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/\s+/g, " ")
    .trim()

  const words = cleaned.split(" ")
  const lowerWords = new Set(["de", "da", "do", "das", "dos", "em", "na", "no", "nas", "nos", "com", "para", "a", "e", "o"])

  return words
    .map((word, idx) => {
      // Se tiver parêntese ou hífen ou pontuação
      const cleanWord = word.toLowerCase()
      if (idx > 0 && lowerWords.has(cleanWord)) {
        return cleanWord
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(" ")
}

export function translateExerciseName(id: string, spanishName: string): string {
  if (SPECIFIC_EXERCISE_NAMES[id]) {
    return SPECIFIC_EXERCISE_NAMES[id]
  }

  let translated = spanishName
  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    translated = translated.replace(pattern, replacement)
  }

  return formatTitleCase(translated)
}

export function translateInstruction(instruction: string): string {
  const mapped = INSTRUCTIONS_MAP[instruction.trim()]
  if (mapped) return mapped

  // Fallback caso apareça alguma instrução levemente diferente
  let res = instruction
  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    res = res.replace(pattern, replacement)
  }
  return res
}

async function main() {
  console.log("🚀 Sincronizando catálogo de exercícios da ExerciseGymGifsDB...")
  const SOURCE_URL = "https://raw.githubusercontent.com/JahelCuadrado/ExerciseGymGifsDB/main/api/es/exercises.json"

  const response = await fetch(SOURCE_URL)
  if (!response.ok) {
    throw new Error(`Erro ao baixar catálogo: HTTP ${response.status} ${response.statusText}`)
  }

  const rawData: RawData = await response.json()
  console.log(`📦 Carregados ${rawData.count} exercícios originais. Processando tradução para PT-BR...`)

  const translatedExercises: CatalogExercise[] = rawData.exercises.map((raw) => {
    const ptName = translateExerciseName(raw.id, raw.name)
    const muscleLabel = MUSCLE_LABELS[raw.muscle] || raw.muscle
    const equipmentLabel = EQUIPMENT_LABELS[raw.equipment] || raw.equipment
    const ptInstructions = raw.instructions.map((ins) => translateInstruction(ins))

    return {
      id: raw.id,
      slug: raw.slug,
      name: ptName,
      originalName: raw.name,
      muscle: raw.muscle,
      muscleLabel,
      equipment: raw.equipment,
      equipmentLabel,
      bodyPart: raw.bodyPart,
      category: raw.category,
      secondaryMuscles: raw.secondaryMuscles,
      instructions: ptInstructions,
      gifUrl: raw.gifUrl,
      thumbUrl: raw.thumbUrl,
    }
  })

  const outputDir = resolve(process.cwd(), "data/exercises")
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = resolve(outputDir, "exercises-pt-br.json")
  writeFileSync(outputPath, JSON.stringify(translatedExercises, null, 2), "utf-8")

  console.log(`✅ Arquivo salvo com sucesso em: ${outputPath}`)
  console.log(`📊 Total de exercícios convertidos: ${translatedExercises.length}`)

  // Amostras de verificação
  console.log("\n🔍 Amostras de exercícios traduzidos:")
  const sampleIndices = [0, 10, 50, 150, 300, 500, 800, 1000, 1200]
  for (const idx of sampleIndices) {
    if (translatedExercises[idx]) {
      const ex = translatedExercises[idx]
      console.log(`- [${ex.muscleLabel} | ${ex.equipmentLabel}] ${ex.name} (original: "${ex.originalName}")`)
    }
  }
}

main().catch((err) => {
  console.error("❌ Falha na sincronização:", err)
  process.exit(1)
})
