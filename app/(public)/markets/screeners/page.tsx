// app/(public)/markets/screeners/page.tsx
// Filter MSE-listed stocks by sector, price, performance, P/E, market
// cap, 52-week range and (soon) dividend yield. Data fetch mirrors the
// stocks page exactly (latest price per counter + 52-week high/low from
// history) — filtering itself happens client-side in ScreenerTool since
// the full counter list is small enough to ship in one payload.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { ScreenerTool } from './ScreenerTool'

export const revalidate = 3600 // re-fetch at most once per hour

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

export default async function ScreenersPage() {
    const supabase = getServiceClient()

    // 1. Latest price per counter
    const { data: rawPrices } = await supabase
        .from('mse_prices')
        .select('price, change_pct, market_cap, pe_ratio, price_date, counter_id, mse_counters(id, symbol, company_name, sector)')
        .order('price_date', { ascending: false })
        .limit(128)

    const seenId = new Set<number>()
    const latest = (rawPrices ?? []).filter((p: any) => {
        if (seenId.has(p.counter_id)) return false
        seenId.add(p.counter_id)
        return true
    })

    // 2. 52-week high/low from history
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const since = oneYearAgo.toISOString().slice(0, 10)

    const { data: history } = await supabase
        .from('mse_prices')
        .select('counter_id, price')
        .gte('price_date', since)

    const rangeMap = new Map<number, { high: number; low: number }>()
    for (const row of history ?? []) {
        const price = Number(row.price)
        const existing = rangeMap.get(row.counter_id)
        if (!existing) {
            rangeMap.set(row.counter_id, { high: price, low: price })
        } else {
            if (price > existing.high) existing.high = price
            if (price < existing.low) existing.low = price
        }
    }

    // 3. TODO(dividend-yield): once the corporate-actions scraper is back on
    // config-driven IR-page ingestion, join trailing-12-month dividends per
    // counter here and compute yield = ttm_dividends / price * 100. Wire the
    // result into the `dividend_yield` field below — the ScreenerTool UI
    // (filter, column, presets) already expects it and needs no changes.

    // 4. Shape data for the client component
    const stocks = latest
        .filter((p: any) => p.mse_counters?.symbol)
        .map((p: any) => {
            const range = rangeMap.get(p.counter_id)
            return {
                symbol: p.mse_counters.symbol as string,
                company_name: p.mse_counters.company_name as string,
                sector: (p.mse_counters.sector ?? '—') as string,
                price: Number(p.price),
                change_pct: p.change_pct != null ? Number(p.change_pct) : null,
                pe_ratio: p.pe_ratio != null ? Number(p.pe_ratio) : null,
                market_cap: p.market_cap != null ? Number(p.market_cap) : null,
                week52_high: range?.high ?? null,
                week52_low: range?.low ?? null,
                dividend_yield: null as number | null, // stubbed until corporate-actions pipeline lands
            }
        })
        .sort((a, b) => a.symbol.localeCompare(b.symbol))

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-[20px] font-semibold text-(--color-text-primary)">Screeners</h1>
                <p className="mt-0.5 text-[13px] text-(--color-text-tertiary)">
                    Filter all {stocks.length} MSE-listed counters by sector, price, performance, P/E, market cap and 52-week range
                </p>
            </div>

            <ScreenerTool stocks={stocks} />
        </div>
    )
}