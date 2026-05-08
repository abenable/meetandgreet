/**
 * Safe helpers for <input type="datetime-local"> ↔ UTC round-trips.
 *
 * The native `new Date("YYYY-MM-DDTHH:mm:ss")` is interpreted as **local time**
 * in modern Chrome/Node BUT as **UTC** in Safari and some older engines. That
 * inconsistency causes off-by-timezone-offset bugs (e.g. picking 08:00 local
 * stores as 08:00 UTC then renders as 11:00 in UTC+3).
 *
 * These helpers avoid string parsing ambiguity by using the multi-argument
 * Date constructor (which is always local) or by appending an explicit 'Z'
 * when we *intend* UTC.
 */

/**
 * Convert a local datetime string from `<input type="datetime-local">`
 * (format: `YYYY-MM-DDTHH:mm`) into a UTC ISO-8601 string.
 */
export function localDatetimeToUTCISO(localValue: string): string {
  const [datePart, timePart] = localValue.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const d = new Date(year, month - 1, day, hour, minute, 0, 0)
  return d.toISOString()
}

/**
 * Parse a value that might come from the server (Date, ISO string, or plain
 * string) into a UTC `Date` object safely.
 */
export function parseServerDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null) return null
  if (value instanceof Date) return value

  const str = String(value).trim()

  // Plain ISO datetime without timezone suffix (e.g. "2026-05-08 21:00:00").
  // Treat it as UTC by forcing a 'Z' so it doesn't get parsed as local.
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(str)) {
    return new Date(str.replace(' ', 'T') + 'Z')
  }

  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Convert a UTC Date / server timestamp into the `YYYY-MM-DDTHH:mm` string
 * required by `<input type="datetime-local">` (local time).
 */
export function toDatetimeLocalValue(value: Date | string | number | null | undefined): string {
  const d = parseServerDate(value)
  if (!d) return ''

  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getFullYear() +
    '-' + pad(d.getMonth() + 1) +
    '-' + pad(d.getDate()) +
    'T' + pad(d.getHours()) +
    ':' + pad(d.getMinutes())
  )
}
