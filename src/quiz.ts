// 문제 데이터 로딩 + 채점 + 진행률 저장 (localStorage가 유일한 영속 SoT)

export type Category = {
  id: number
  name: string
}

export type Question = {
  id: number
  category_id: number
  question_text: string
  choices: string[]
  answer: number
  explanation: string
}

export type QuestionBank = {
  categories: Category[]
  questions: Question[]
}

export type Unit = {
  id: number
  title: string
  questions: Question[]
}

export type UnitProgress = {
  answered: Record<string, boolean>
  picks?: Record<string, string>
}

export type Progress = Record<string, UnitProgress>

const STORAGE_KEY = 'mathweb-types30'

export async function loadQuestionBank(): Promise<QuestionBank> {
  const res = await fetch('data/questions.json')
  if (!res.ok) throw new Error('questions.json 로드 실패')
  return (await res.json()) as QuestionBank
}

export function buildUnits(bank: QuestionBank): Unit[] {
  return bank.categories
    .map((cat) => ({
      id: cat.id,
      title: cat.name,
      questions: bank.questions.filter((q) => q.category_id === cat.id),
    }))
    .filter((unit) => unit.questions.length > 0)
}

export function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Progress
  } catch {
    return {}
  }
}

export function saveProgress(progress: Progress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function resetUnit(unitId: number): void {
  const progress = loadProgress()
  progress[unitId] = { answered: {} }
  saveProgress(progress)
}

export function resetAllProgress(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function recordAnswer(unitId: number, questionId: number, isCorrect: boolean, pick: string): void {
  const progress = loadProgress()
  const slot = progress[unitId] || { answered: {} }
  slot.answered[questionId] = isCorrect
  slot.picks = { ...(slot.picks || {}), [questionId]: pick }
  progress[unitId] = slot
  saveProgress(progress)
}

export function unitStats(unit: Unit, progress: Progress) {
  const answered = progress[unit.id]?.answered || {}
  const questionCount = Object.keys(answered).length
  const correctCount = Object.values(answered).filter(Boolean).length
  const total = unit.questions.length
  const done = total > 0 && questionCount >= total
  const started = questionCount > 0 && !done
  const score = done ? Math.round((correctCount / questionCount) * 100) : 0
  return { done, started, score, progressPercent: total > 0 ? Math.round((questionCount / total) * 100) : 0 }
}

export function gradeObjective(
  question: Question,
  studentAnswer: string,
): { isCorrect: boolean; feedback: string; explanation: string; correctText: string } {
  const choices = question.choices || []
  const answerIndex = question.answer
  const correctText =
    typeof answerIndex === 'number' && choices[answerIndex] != null ? choices[answerIndex] : ''
  const explanation = question.explanation || ''
  const isCorrect = typeof studentAnswer === 'string' && studentAnswer.trim() === String(correctText).trim()
  const feedback = isCorrect ? '정답입니다!' : '아쉽네요!'
  return { isCorrect, feedback, explanation, correctText }
}
