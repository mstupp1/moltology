/**
 * Shared date formatting. The server renders in UTC, so anything shown in the
 * HTML must be formatted with the same time zone during hydration. Pass
 * `timeZone: 'UTC'` for that pass and `undefined` (the browser zone) after it;
 * `<LocalTime>` does this for you.
 */

export type DateInput = string | number | Date

export function toDate(value: DateInput): Date | null {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "Sep 11, 2026" */
export function formatDay(value: DateInput, timeZone?: string): string {
  const date = toDate(value)
  if (!date) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone })
}

/** "Sep 11, 2026, 08:15 PM" */
export function formatDayTime(value: DateInput, timeZone?: string): string {
  const date = toDate(value)
  if (!date) return ''
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  })
}
