import { useHydrated } from '@/hooks/useHydrated'
import { formatDay, toDate, type DateInput } from '@/lib/dates'

export interface LocalTimeProps {
  value: DateInput
  /** Formats the date; `timeZone` is 'UTC' until hydration, then undefined (browser zone). */
  format?: (value: DateInput, timeZone?: string) => string
  /** Optional hover text, formatted the same way. */
  titleFormat?: (value: DateInput, timeZone?: string) => string
  className?: string
}

/**
 * Renders a date that matches the server HTML on first paint, then switches
 * to the viewer's time zone. Relative labels ("3h ago") can tick over between
 * server and browser, so the text node is allowed to differ.
 */
export function LocalTime({ value, format = formatDay, titleFormat, className }: LocalTimeProps) {
  const hydrated = useHydrated()
  const timeZone = hydrated ? undefined : 'UTC'
  const date = toDate(value)
  return (
    <time
      dateTime={date?.toISOString()}
      title={titleFormat ? titleFormat(value, timeZone) : undefined}
      className={className}
      suppressHydrationWarning
    >
      {format(value, timeZone)}
    </time>
  )
}
