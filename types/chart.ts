// import { createClient as createServiceClient } from '@supabase/supabase-js'

// export type ChartPoint = {
//     date: string
//     value: number
// }

// export type RangeKey = '30D' | '3M' | '1Y'

// const RANGE_DAYS: Record<RangeKey, number> = {
//     '30D': 30,
//     '3M': 90,
//     '1Y': 365,
// }

// function getServiceClient() {
//     return createServiceClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.SUPABASE_SERVICE_ROLE_KEY!
//     )
// }

// function startDateFor(range: RangeKey): string {
//     const days = RANGE_DAYS[range]
//     const d = new Date()
//     d.setDate(d.getDate() - days)
//     return d.toISOString().slice(0, 10)
// }

// /**
//  * Fetches raw price history for a single counter (by symbol) over the
//  * given range, returning {date, value} points sorted ascending by date.
//  */
// export async function getCounterHistory(symbol: string, range: RangeKey): Promise<ChartPoint[]> {
//     const supabase = getServiceClient()
//     const startDate = startDateFor(range)

//     const { data: counter } = await supabase
//         .from('mse_counters')
//         .select('id')
//         .eq('symbol', symbol.toUpperCase())
//         .maybeSingle()

//     if (!counter) return []

//     const { data: prices } = await supabase
//         .from('mse_prices')
//         .select('price_date, price')
//         .eq('counter_id', counter.id)
//         .gte('price_date', startDate)
//         .order('price_date', { ascending: true })

//     return (prices ?? []).map((p) => ({
//         date: p.price_date,
//         value: Number(p.price),
//     }))
// }

// /**
//  * Computes an equal-weighted composite index across every counter
//  * with price history in the given range. For each day, every
//  * counter's price is expressed as a % change from its own first
//  * available price within the range (its local base date), and the
//  * composite value for that day is the average of those % changes
//  * across all counters that have data on that day.
//  *
//  * This is NOT the official MASI (which is value/market-cap weighted)
//  * — it's a simpler, honest equal-weighted proxy across tracked
//  * counters, and should be labeled as such in the UI.
//  */
// export async function getCompositeHistory(range: RangeKey): Promise<ChartPoint[]> {
//     const supabase = getServiceClient()
//     const startDate = startDateFor(range)

//     const { data: prices } = await supabase
//         .from('mse_prices')
//         .select('price_date, price, counter_id')
//         .gte('price_date', startDate)
//         .order('price_date', { ascending: true })

//     if (!prices || prices.length === 0) return []

//     // Group prices by counter, in chronological order.
//     const byCounter = new Map<number, { price_date: string; price: number }[]>()
//     for (const row of prices) {
//         const list = byCounter.get(row.counter_id) ?? []
//         list.push({ price_date: row.price_date, price: Number(row.price) })
//         byCounter.set(row.counter_id, list)
//     }

//     // For each counter, compute % change from its own first price in range.
//     // dailyChanges: date -> array of % changes from every counter active that day
//     const dailyChanges = new Map<string, number[]>()

//     for (const rows of byCounter.values()) {
//         if (rows.length === 0) continue
//         const basePrice = rows[0].price
//         if (!basePrice) continue

//         for (const row of rows) {
//             const pctChange = ((row.price - basePrice) / basePrice) * 100
//             const list = dailyChanges.get(row.price_date) ?? []
//             list.push(pctChange)
//             dailyChanges.set(row.price_date, list)
//         }
//     }

//     const points: ChartPoint[] = Array.from(dailyChanges.entries())
//         .map(([date, changes]) => ({
//             date,
//             value: changes.reduce((sum, c) => sum + c, 0) / changes.length,
//         }))
//         .sort((a, b) => a.date.localeCompare(b.date))

//     return points
// }