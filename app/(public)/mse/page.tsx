// app/(public)/mse/page.tsx
// MSE overview board — all 16 listed counters at a glance.
// Columns: Symbol, Company, Sector, Price, Change%, Volume, P/E, Market Cap, 52-wk Range.
// This is the canonical stocks list for the app — /markets/stocks was a
// duplicate of this same data and has been retired in its favor (see
// next.config.ts for the redirect). Sorting is client-side via StocksTable.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { StocksTable } from './StocksTable'


export const revalidate = 3600 // re-fetch at most once per hour

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

export default async function MSEPage() {
    const supabase = getServiceClient()

    // 1. Latest price/detail row per counter
    const { data: rawPrices } = await supabase
        .from('mse_prices')
        .select('price, change_pct, volume, market_cap, pe_ratio, price_date, counter_id, mse_counters(id, symbol, company_name, sector)')
        .order('price_date', { ascending: false })
        .limit(128)

    // Deduplicate: keep only the most recent row per counter_id
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

    // 3. Shape data for the client component
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
                volume: p.volume != null ? Number(p.volume) : null,
                pe_ratio: p.pe_ratio != null ? Number(p.pe_ratio) : null,
                market_cap: p.market_cap != null ? Number(p.market_cap) : null,
                week52_high: range?.high ?? null,
                week52_low: range?.low ?? null,
                price_date: p.price_date as string,
            }
        })
        .sort((a, b) => a.symbol.localeCompare(b.symbol))

    const lastUpdated = latest[0]?.price_date
        ? new Date(latest[0].price_date).toLocaleDateString('en-MW', {
            day: 'numeric', month: 'long', year: 'numeric',
        })
        : null

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-[20px] font-semibold text-(--color-text-primary)">
                    Malawi Stock Exchange
                </h1>
                <p className="mt-0.5 text-[13px] text-(--color-text-tertiary)">
                    All {stocks.length} counters listed on the MSE
                    {lastUpdated && <> · Prices as of {lastUpdated}</>}
                </p>
            </div>

            {/* Sortable table */}
            <StocksTable stocks={stocks} />
        </div>
    )
}