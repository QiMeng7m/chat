export type CheckInKind = 'normal' | 'makeup'

export type CheckInDayRecord = {
  date: string
  kind: CheckInKind
  distanceKm: number
  imageUrl: string
  createdAt: string
}

export type CalendarDayStatus =
  | 'empty'
  | 'future'
  | 'today'
  | 'checked'
  | 'makeup'
  | 'missed'
  | 'missed-disabled'

export type CalendarCell = {
  date: string | null
  day: number | null
  status: CalendarDayStatus
  record?: CheckInDayRecord
}

export type MakeupCredits = {
  normalTotal: number
  makeupUsed: number
  makeupEarned: number
  makeupAvailable: number
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const

export function getWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatMonthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function formatMonthLabel(date: Date): string {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`
}

export function formatDayLabel(dateKey: string): string {
  const date = parseDateKey(dateKey)
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
}

export function isPastDate(dateKey: string, todayKey = formatDateKey(new Date())): boolean {
  return dateKey < todayKey
}

export function isFutureDate(dateKey: string, todayKey = formatDateKey(new Date())): boolean {
  return dateKey > todayKey
}

export function computeMakeupCredits(records: CheckInDayRecord[]): MakeupCredits {
  const normalTotal = records.filter((r) => r.kind === 'normal').length
  const makeupUsed = records.filter((r) => r.kind === 'makeup').length
  const makeupEarned = Math.floor(normalTotal / 2)
  const makeupAvailable = Math.max(0, makeupEarned - makeupUsed)

  return { normalTotal, makeupUsed, makeupEarned, makeupAvailable }
}

export function countMonthCheckIns(records: CheckInDayRecord[], monthKey: string): number {
  return records.filter((r) => r.date.startsWith(monthKey)).length
}

export function buildMonthGrid(
  month: Date,
  records: CheckInDayRecord[],
  options?: { todayKey?: string; makeupAvailable?: number },
): CalendarCell[] {
  const todayKey = options?.todayKey ?? formatDateKey(new Date())
  const makeupAvailable = options?.makeupAvailable ?? 0
  const recordMap = new Map(records.map((r) => [r.date, r]))

  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

  const cells: CalendarCell[] = []

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ date: null, day: null, status: 'empty' })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = formatDateKey(new Date(year, monthIndex, day))
    const record = recordMap.get(dateKey)
    let status: CalendarDayStatus

    if (record?.kind === 'makeup') {
      status = 'makeup'
    } else if (record?.kind === 'normal') {
      status = 'checked'
    } else if (dateKey === todayKey) {
      status = 'today'
    } else if (isFutureDate(dateKey, todayKey)) {
      status = 'future'
    } else if (makeupAvailable > 0) {
      status = 'missed'
    } else {
      status = 'missed-disabled'
    }

    cells.push({ date: dateKey, day, status, record })
  }

  return cells
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}
