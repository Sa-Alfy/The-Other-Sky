const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

function pluralize(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? '' : 's'} ago`
}

export function formatRelativeTime(isoDate: string, now = Date.now()): string {
  const then = new Date(isoDate).getTime()
  if (Number.isNaN(then)) return 'Recently'

  const diffMs = Math.max(0, now - then)

  if (diffMs < MINUTE) return 'Just now'
  if (diffMs < HOUR) return pluralize(Math.floor(diffMs / MINUTE), 'minute')
  if (diffMs < DAY) return pluralize(Math.floor(diffMs / HOUR), 'hour')
  if (diffMs < WEEK) return pluralize(Math.floor(diffMs / DAY), 'day')
  if (diffMs < MONTH) return pluralize(Math.floor(diffMs / WEEK), 'week')
  if (diffMs < YEAR) return pluralize(Math.floor(diffMs / MONTH), 'month')
  return pluralize(Math.floor(diffMs / YEAR), 'year')
}
