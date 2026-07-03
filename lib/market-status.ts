// lib/market-status.ts
// MSE trading hours: Mon-Fri, 09:00-15:00, Africa/Blantyre (GMT+2, no DST).
// Rendered server-side per request — intentionally not a live ticking
// countdown, since that would require client JS just to avoid a fake number.

const OPEN_HOUR = 9
const CLOSE_HOUR = 15
const TIMEZONE = 'Africa/Blantyre'

export type MarketStatus = {
    isOpen: boolean
    label: string
}

function blantyreParts(date: Date) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: TIMEZONE,
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23',
    }).formatToParts(date)

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
    return {
        weekday: get('weekday'),
        hour: Number(get('hour')),
        minute: Number(get('minute')),
    }
}

export function getMseMarketStatus(now: Date = new Date()): MarketStatus {
    const { weekday, hour, minute } = blantyreParts(now)
    const isWeekday = !['Sat', 'Sun'].includes(weekday)
    const minutesNow = hour * 60 + minute
    const isTradingHours = minutesNow >= OPEN_HOUR * 60 && minutesNow < CLOSE_HOUR * 60

    if (isWeekday && isTradingHours) {
        const minutesLeft = CLOSE_HOUR * 60 - minutesNow
        const h = Math.floor(minutesLeft / 60)
        const m = minutesLeft % 60
        const remaining = h > 0 ? `${h}h ${m}m` : `${m}m`
        return { isOpen: true, label: `Market open · closes in ${remaining}` }
    }

    return { isOpen: false, label: `Market closed · opens ${nextOpenLabel(weekday, minutesNow)}` }
}

function nextOpenLabel(weekday: string, minutesNow: number): string {
    const isWeekday = !['Sat', 'Sun'].includes(weekday)
    if (isWeekday && minutesNow < OPEN_HOUR * 60) {
        return `at ${OPEN_HOUR}:00`
    }
    return weekday === 'Fri' || weekday === 'Sat' ? 'Mon 9:00' : 'tomorrow 9:00'
}