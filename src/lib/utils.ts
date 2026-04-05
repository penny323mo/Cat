import { differenceInMonths, differenceInYears, format, formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export function formatCatAge(birthday?: string): string {
  if (!birthday) return '年齡不詳'
  const birth = new Date(birthday)
  const years = differenceInYears(new Date(), birth)
  const months = differenceInMonths(new Date(), birth) % 12
  if (years === 0) return `${months} 個月`
  if (months === 0) return `${years} 歲`
  return `${years} 歲 ${months} 個月`
}

export function catAgeToHuman(birthday?: string): string {
  if (!birthday) return ''
  const months = differenceInMonths(new Date(), new Date(birthday))
  // rough conversion: 1 cat year ≈ 15 human years for first year, 9 for second, 4 per year after
  let human = 0
  if (months <= 12) human = Math.round((months / 12) * 15)
  else if (months <= 24) human = 15 + Math.round(((months - 12) / 12) * 9)
  else human = 24 + Math.round(((months - 24) / 12) * 4)
  return `相當於人類 ${human} 歲`
}

export function formatDate(date: string): string {
  return format(new Date(date), 'yyyy年MM月dd日', { locale: zhTW })
}

export function formatDateTime(date: string): string {
  return format(new Date(date), 'MM月dd日 HH:mm', { locale: zhTW })
}

export function formatRelative(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhTW })
}

export const FOOD_TYPE_LABELS: Record<string, string> = {
  dry: '乾糧',
  wet: '濕糧',
  treat: '零食',
  other: '其他',
}

export const MOOD_LABELS: Record<string, string> = {
  happy: '開心',
  playful: '好玩',
  sleepy: '瞌睡',
  anxious: '緊張',
  sick: '唔舒服',
  angry: '扭計',
}

export const MOOD_EMOJIS: Record<string, string> = {
  happy: '😸',
  playful: '😺',
  sleepy: '😴',
  anxious: '😿',
  sick: '🤒',
  angry: '😾',
}

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  food: '食物',
  medical: '醫療',
  toy: '玩具',
  grooming: '美容',
  other: '其他',
}

export const EXPENSE_CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍱',
  medical: '💊',
  toy: '🎾',
  grooming: '✂️',
  other: '📦',
}

export const REMINDER_TYPE_LABELS: Record<string, string> = {
  vaccine: '疫苗',
  deworming: '驅蟲',
  vet_visit: '覆診',
  custom: '自訂',
}
