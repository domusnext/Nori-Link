import type { DateValue } from '@internationalized/date'
import { CalendarDate, fromAbsolute, fromDate, getLocalTimeZone, now, startOfMonth, startOfWeek, toCalendarDate } from '@internationalized/date'

const ANALYTICS_TIME_ZONE = 'America/New_York'

export function getTimeZone() {
  if (typeof Intl === 'undefined')
    return 'Etc/UTC'

  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function getAnalyticsTimeZone() {
  return ANALYTICS_TIME_ZONE
}

export function getLocale() {
  if (typeof Intl === 'undefined')
    return typeof navigator === 'undefined' ? 'en-US' : navigator.language

  return Intl.DateTimeFormat().resolvedOptions().locale
}

export function shortDate(unix = 0, locale?: string, timeZone?: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeZone }).format(unix * 1000)
}

export function longDate(unix = 0, locale?: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(unix * 1000)
}

export function shortTime(unix = 0, locale?: string) {
  return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(unix * 1000)
}

export function longTime(unix = 0, locale?: string) {
  return new Intl.DateTimeFormat(locale, { timeStyle: 'long' }).format(unix * 1000)
}

export function date2unix(dateValue: DateValue | Date, type?: string, timeZone = getTimeZone()) {
  if (dateValue instanceof Date) {
    if (!type)
      return Math.floor(dateValue.getTime() / 1000)

    const zonedDate = fromDate(dateValue, timeZone)
    dateValue = new CalendarDate(zonedDate.year, zonedDate.month, zonedDate.day)
  }

  if (type === 'start')
    return Math.floor(new CalendarDate(dateValue.year, dateValue.month, dateValue.day).toDate(timeZone).getTime() / 1000)

  if (type === 'end') {
    const nextDay = new CalendarDate(dateValue.year, dateValue.month, dateValue.day).add({ days: 1 })
    return Math.floor(nextDay.toDate(timeZone).getTime() / 1000) - 1
  }

  if ('timeZone' in dateValue)
    return Math.floor(dateValue.toDate().getTime() / 1000)

  return Math.floor(dateValue.toDate(timeZone).getTime() / 1000)
}

export function unix2date(unix: number) {
  return toCalendarDate(fromAbsolute(unix * 1000, getTimeZone()))
}

export function getWeekdayNames(style: 'long' | 'short' | 'narrow' = 'short', locale?: string) {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: style })
  // 2024-01-01 is Monday
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2024, 0, 1 + i)
    return formatter.format(date)
  })
}

export function computeDateRange(name: string, locale?: string, timeZone = getLocalTimeZone()): [number, number] {
  const currentTime = now(timeZone)

  const presets: Record<string, () => [number, number]> = {
    'today': () => [date2unix(currentTime, 'start', timeZone), date2unix(currentTime, undefined, timeZone)],
    'last-24h': () => [date2unix(currentTime.subtract({ hours: 24 }), undefined, timeZone), date2unix(currentTime, undefined, timeZone)],
    'this-week': () => [date2unix(startOfWeek(currentTime, locale || getLocale()), 'start', timeZone), date2unix(currentTime, undefined, timeZone)],
    'last-7d': () => [date2unix(currentTime.subtract({ days: 7 }), undefined, timeZone), date2unix(currentTime, undefined, timeZone)],
    'this-month': () => [date2unix(startOfMonth(currentTime), 'start', timeZone), date2unix(currentTime, undefined, timeZone)],
    'last-30d': () => [date2unix(currentTime.subtract({ days: 30 }), undefined, timeZone), date2unix(currentTime, undefined, timeZone)],
    'last-90d': () => [date2unix(currentTime.subtract({ days: 90 }), undefined, timeZone), date2unix(currentTime, undefined, timeZone)],
  }

  const getRange = presets[name]
  return getRange ? getRange() : presets['last-7d']!()
}
