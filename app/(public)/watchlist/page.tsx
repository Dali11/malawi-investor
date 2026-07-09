// app/(public)/watchlist/page.tsx
// Personal watchlist — reuses StocksTable (same columns, same star
// toggle) filtered down to just the counters this user has starred.
// Unlike /stocks, this always requires login since there's nothing
// meaningful to show a signed-out visitor.

import { redirect } from 'next/navigation'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createSessionClient } from '@/lib/supabase/server'
import { StocksTable, type StockRow } from '@/app/(public)/stocks/StocksTable'

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

export default async function WatchlistPage() {
    const sessionClient = await createSessionClient()
    const { data: { user } } = await sessionClient.auth.getUser()

    if (!user) {
        redirect('/login?redirect=/watchlist')
    }

    const { data: watchlist } = await sessionClient
        .from('watchlist_items')
        .select('counter_id')
        .eq('user_id', user.id)

    const watchedIds = (watchlist ?? []).map((w) => w.counter_id)

    if (watchedIds.length === 0) {
        return (
            <div className="space-y-4">
                <h1 className="text-[20px] font-semibold text-(--color-text-primary)">My watchlist</h1>
                <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) px-4 py-10 text-center shadow-(--shadow-card)">
                    <p className="text-[13px] text-(--color-text-tertiary)">
                        Nothing starred yet — tap the star on any counter in{' '}
                        <a href="/stocks" className="text-(--color-text-warning) no-underline hover:underline">
                            Stocks
                        </a>{' '}
                        to track it here.
                    </p>
                </div>
            </div>
        )
    }

    const supabase = getServiceClient()

    const { data: rawPrices } = await supabase
        .from('mse_prices')
        .select('price, change_pct, volume, market_cap, pe_ratio, price_date, counter_id, mse_counters(id, symbol, company_name, sector)')
        .in('counter_id', watchedIds)
        .order('price_date', { ascending: false })
        .limit(watchedIds.length * 8) 

    const seenId = new Set<number>()
    const latest = (rawPrices ?? []).filter((p: any) => {
        if (seenId.has(p.counter_id)) return false
        seenId.add(p.counter_id)
        return true
    })

    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const since = oneYearAgo.toISOString().slice(0, 10)

    const { data: history } = await supabase
        .from('mse_prices')
        .select('counter_id, price')
        .in('counter_id', watchedIds)
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

    const stocks: StockRow[] = latest
        .filter((p: any) => p.mse_counters?.symbol)
        .map((p: any) => {
            const range = rangeMap.get(p.counter_id)
            return {
                counter_id: p.counter_id as number,
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

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-[20px] font-semibold text-(--color-text-primary)">My watchlist</h1>
                <p className="mt-0.5 text-[13px] text-(--color-text-tertiary)">
                    {stocks.length} counter{stocks.length === 1 ? '' : 's'} tracked
                </p>
            </div>

            <StocksTable stocks={stocks} watchedCounterIds={watchedIds} isLoggedIn={true} />
        </div>
    )
}