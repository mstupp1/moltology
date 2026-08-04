export interface TimeParts {
  hours: number
  minutes: number
}

export interface ReminderTimeResult {
  startHours: number
  startMinutes: number
  reminderHours: number
  reminderMinutes: number
  startTimeFormatted: string
  reminderTimeFormatted: string
}

/**
 * Parses the start time from a schedule string (e.g. "05:30", "06:00–08:00", "13:00 - 17:00").
 */
export function parseStartTime(timeStr: string): TimeParts | null {
  if (!timeStr) return null

  // Extract the first time block before any dash or hyphen
  const firstBlock = timeStr.split(/[-–—]/)[0].trim()
  const parts = firstBlock.split(':')

  if (parts.length < 2) return null

  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }

  return { hours, minutes }
}

/**
 * Formats hours and minutes into zero-padded "HH:MM" string format.
 */
export function formatTime24(hours: number, minutes: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}`
}

/**
 * Calculates the reminder time by subtracting offsetMinutes (default 10) from the task start time.
 */
export function calculateReminderTime(timeStr: string, offsetMinutes = 10): ReminderTimeResult | null {
  const start = parseStartTime(timeStr)
  if (!start) return null

  const startTotalMinutes = start.hours * 60 + start.minutes
  let reminderTotalMinutes = startTotalMinutes - offsetMinutes

  // Handle midnight underflow wrapping around 24 hours (1440 minutes)
  if (reminderTotalMinutes < 0) {
    reminderTotalMinutes += 1440
  }

  const reminderHours = Math.floor(reminderTotalMinutes / 60) % 24
  const reminderMinutes = reminderTotalMinutes % 60

  return {
    startHours: start.hours,
    startMinutes: start.minutes,
    reminderHours,
    reminderMinutes,
    startTimeFormatted: formatTime24(start.hours, start.minutes),
    reminderTimeFormatted: formatTime24(reminderHours, reminderMinutes),
  }
}

/**
 * Determines if a reminder is currently due at the specified Date object.
 */
export function isReminderDue(timeStr: string, currentDate: Date = new Date(), offsetMinutes = 10): boolean {
  const reminder = calculateReminderTime(timeStr, offsetMinutes)
  if (!reminder) return false

  return currentDate.getHours() === reminder.reminderHours && currentDate.getMinutes() === reminder.reminderMinutes
}
