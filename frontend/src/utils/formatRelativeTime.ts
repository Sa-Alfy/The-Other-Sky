import type { StringKey, Translate } from '../i18n'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

const UNITS: { limit: number; size: number; singular: StringKey; plural: StringKey }[] = [
  { limit: HOUR, size: MINUTE, singular: 'time.minute', plural: 'time.minutes' },
  { limit: DAY, size: HOUR, singular: 'time.hour', plural: 'time.hours' },
  { limit: WEEK, size: DAY, singular: 'time.day', plural: 'time.days' },
  { limit: MONTH, size: WEEK, singular: 'time.week', plural: 'time.weeks' },
  { limit: YEAR, size: MONTH, singular: 'time.month', plural: 'time.months' },
]

export function formatRelativeTime(isoDate: string, t: Translate, now = Date.now()): string {
  const then = new Date(isoDate).getTime()
  if (Number.isNaN(then)) return t('time.recently')

  const diffMs = Math.max(0, now - then)
  if (diffMs < MINUTE) return t('time.justNow')

  for (const unit of UNITS) {
    if (diffMs < unit.limit) {
      const value = Math.floor(diffMs / unit.size)
      return t(value === 1 ? unit.singular : unit.plural, { n: value })
    }
  }

  const years = Math.floor(diffMs / YEAR)
  return t(years === 1 ? 'time.year' : 'time.years', { n: years })
}
