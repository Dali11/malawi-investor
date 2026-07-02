import { createClient as createServiceClient } from '@supabase/supabase-js'

export type ChartPoint = {
    date: string
    value: number
    volume?: number | null
}

export type RangeKey = '1D' | '5D' | '1M' | '6M' | 'YTD' | '1Y' | '5Y' | '10Y' | 'MAX'

const RANGE_DAYS: Partial<Record<RangeKey, number>> = {
    '1D': 1,
    '5D': 5,
    '1M': 30,
    '6M': 182,
    '1Y': 365,
    '5Y': 365 * 5,
    '10Y': 365 * 10,
}

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

/**
 * Returns the start date for a range, or null for 'MAX' (meaning: no
 * lower bound, fetch everything available).
 */
function startDateFor(range: RangeKey): string | null {
    if (range === 'MAX') return null

    if (range === 'YTD') {
        const now = new Date()
        return `${now.getFullYear()}-01-01`
    }

    const days = RANGE_DAYS[range]!
    const d = new Date()
    d.setDate(d.getDate() - days)
    return d.toISOString().slice(0, 10)
}

/**
 * Fetches raw price history for a single counter (by symbol) over the
 * given range, returning {date, value} points sorted ascending by date.
 */
export async function getCounterHistory(symbol: string, range: RangeKey): Promise<ChartPoint[]> {
    const supabase = getServiceClient()

    const { data: counter } = await supabase
        .from('mse_counters')
        .select('id')
        .eq('symbol', symbol.toUpperCase())
        .maybeSingle()

    if (!counter) return []

    // 1D/5D mean "the last N trading days we have," not "N calendar
    // days ago" — a calendar cutoff can miss entirely if the most
    // recent N days included a weekend with no trading.
    if (range === '1D' || range === '5D') {
        const limit = range === '1D' ? 1 : 5
        const { data: prices } = await supabase
            .from('mse_prices')
            .select('price_date, price, volume')
            .eq('counter_id', counter.id)
            .order('price_date', { ascending: false })
            .limit(limit)

        return (prices ?? [])
            .map((p) => ({ date: p.price_date, value: Number(p.price), volume: p.volume }))
            .reverse()
    }

    const startDate = startDateFor(range)
    let query = supabase
        .from('mse_prices')
        .select('price_date, price, volume')
        .eq('counter_id', counter.id)
        .order('price_date', { ascending: true })

    if (startDate) {
        query = query.gte('price_date', startDate)
    }

    const { data: prices } = await query

    return (prices ?? []).map((p) => ({
        date: p.price_date,
        value: Number(p.price),
        volume: p.volume,
    }))
}

/**
 * Fetches absolute index-level history (e.g. MASI) from `mse_indices`
 * over the given range. MDSI/MFSI don't carry an absolute `value` from
 * the source site (afx.kwayisi.org only publishes % changes for those
 * two), so this will return an empty series for any index_code whose
 * `value` column is always null — callers should fall back to showing
 * the % change figures directly rather than a chart for those.
 */
export async function getIndexHistory(indexCode: string, range: RangeKey): Promise<ChartPoint[]> {
    const supabase = getServiceClient()

    if (range === '1D' || range === '5D') {
        const limit = range === '1D' ? 1 : 5
        const { data: rows } = await supabase
            .from('mse_indices')
            .select('index_date, value')
            .eq('index_code', indexCode.toUpperCase())
            .not('value', 'is', null)
            .order('index_date', { ascending: false })
            .limit(limit)

        return (rows ?? [])
            .map((r) => ({ date: r.index_date, value: Number(r.value) }))
            .reverse()
    }

    const startDate = startDateFor(range)
    let query = supabase
        .from('mse_indices')
        .select('index_date, value')
        .eq('index_code', indexCode.toUpperCase())
        .not('value', 'is', null)
        .order('index_date', { ascending: true })

    if (startDate) {
        query = query.gte('index_date', startDate)
    }

    const { data: rows } = await query

    return (rows ?? []).map((r) => ({
        date: r.index_date,
        value: Number(r.value),
    }))
}

/**
 * Computes an equal-weighted composite index across every counter
 * with price history in the given range.
 *
 * Counters don't all report on the same days (some only update every
 * few days, others daily), so naively averaging "whichever counters
 * have a row on day X" causes the composite to swing based on WHICH
 * counters happen to be included that day, not actual market moves.
 *
 * To fix this, every counter's price series is forward-filled onto a
 * complete daily calendar covering the full range (carrying the last
 * known price forward through gaps), so every day's average is
 * computed across the exact same fixed basket of counters. Each
 * counter's % change is measured from its own price on the range's
 * first calendar day (forward-filled if it didn't report that day).
 *
 * This is NOT the official MASI (which is value/market-cap weighted)
 * — it's a simpler, honest equal-weighted proxy across tracked
 * counters, and should be labeled as such in the UI.
 */
export async function getCompositeHistory(range: RangeKey): Promise<ChartPoint[]> {
    const supabase = getServiceClient()
    const startDate = startDateFor(range)

    let query = supabase
        .from('mse_prices')
        .select('price_date, price, counter_id')
        .order('price_date', { ascending: true })

    if (startDate) {
        query = query.gte('price_date', startDate)
    }

    const { data: prices } = await query

    if (!prices || prices.length === 0) return []

    // Group raw prices by counter.
    const byCounter = new Map<number, Map<string, number>>()
    for (const row of prices) {
        const map = byCounter.get(row.counter_id) ?? new Map<string, number>()
        map.set(row.price_date, Number(row.price))
        byCounter.set(row.counter_id, map)
    }

    // Build the full list of calendar dates actually present across all
    // counters (trading days), sorted ascending.
    const allDates = Array.from(new Set(prices.map((p) => p.price_date))).sort()
    if (allDates.length === 0) return []

    // Forward-fill each counter's price across every date in allDates.
    // A counter with no price on or before a given date is skipped
    // entirely for that date (can't forward-fill from nothing).
    const filledByCounter = new Map<number, Map<string, number>>()

    for (const [counterId, dateMap] of byCounter.entries()) {
        const filled = new Map<string, number>()
        let lastKnown: number | null = null

        for (const date of allDates) {
            if (dateMap.has(date)) {
                lastKnown = dateMap.get(date)!
            }
            if (lastKnown !== null) {
                filled.set(date, lastKnown)
            }
        }
        filledByCounter.set(counterId, filled)
    }

    // Base price per counter = its forward-filled price on the first
    // calendar date. Counters with no data by that first date are
    // excluded from the composite entirely (rather than joining mid-way
    // and distorting the average).
    const firstDate = allDates[0]
    const basePrices = new Map<number, number>()
    for (const [counterId, filled] of filledByCounter.entries()) {
        const base = filled.get(firstDate)
        if (base) basePrices.set(counterId, base)
    }

    const points: ChartPoint[] = allDates.map((date) => {
        const changes: number[] = []
        for (const [counterId, basePrice] of basePrices.entries()) {
            const price = filledByCounter.get(counterId)?.get(date)
            if (price === undefined) continue
            changes.push(((price - basePrice) / basePrice) * 100)
        }
        const value = changes.length > 0 ? changes.reduce((sum, c) => sum + c, 0) / changes.length : 0
        return { date, value }
    })

    return points
}