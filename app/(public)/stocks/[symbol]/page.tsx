// app/(public)/mse/[symbol]/page.tsx
// Individual counter detail page. Header (price/change) + a single tab
// bar: Market overview (stats + price/volume chart), Announcements,
// News, Reports, Dividends. See CounterOverviewTabs for the tab UI.
//
// Data notes:
// - "Open" is frequently blank on the scrape source (afx.kwayisi.org
//   often doesn't publish an opening price) — shows "—" when absent
//   rather than guessing.
// - P/BV, "Listed" year, founded date, ISIN, website, and IPO growth
//   aren't in the database yet (no source currently provides them for
//   most counters) — deliberately left out of this pass rather than
//   shown as permanent placeholders. See the "About the company" card
//   in the design mockup for what's still to come.

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createSessionClient } from '@/lib/supabase/server'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import { CounterOverviewTabs } from '@/components/markets/CounterOverviewTabs'
import { WatchlistButton } from '@/components/watchlist/WatchlistButton'
import { PriceAlertButton } from '@/components/watchlist/PriceAlertButton'

export const revalidate = 3600

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

function formatPrice(n: number) {
    return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatMarketCap(n: number | null) {
    if (!n) return '—'
    if (n >= 1_000_000_000_000) return `MK ${(n / 1_000_000_000_000).toFixed(2)}T`
    if (n >= 1_000_000_000) return `MK ${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `MK ${(n / 1_000_000).toFixed(0)}M`
    return `MK ${n.toLocaleString('en')}`
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-MW', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Params = { symbol: string }

export async function generateMetadata({
    params,
}: {
    params: Promise<Params>
}): Promise<Metadata> {
    const { symbol } = await params
    const supabase = getServiceClient()
    const { data: counter } = await supabase
        .from('mse_counters')
        .select('symbol, company_name')
        .ilike('symbol', symbol)
        .single()

    if (!counter) return { title: 'Counter not found' }
    return { title: `${counter.symbol} — ${counter.company_name} | Malawi Investor` }
}

export default async function CounterPage({
    params,
}: {
    params: Promise<Params>
}) {
    const { symbol } = await params
    const supabase = getServiceClient()
    const sessionClient = await createSessionClient()
    const { data: { user } } = await sessionClient.auth.getUser()

    const { data: counter } = await supabase
        .from('mse_counters')
        .select('id, symbol, company_name, sector')
        .ilike('symbol', symbol)
        .single()

    if (!counter) notFound()

    let isWatched = false
    let activeAlerts: { id: string; target_price: number; direction: 'above' | 'below' }[] = []
    if (user) {
        const { data: watchRow } = await sessionClient
            .from('watchlist_items')
            .select('id')
            .eq('user_id', user.id)
            .eq('counter_id', counter.id)
            .maybeSingle()
        isWatched = !!watchRow

        const { data: alertRows } = await sessionClient
            .from('price_alerts')
            .select('id, target_price, direction')
            .eq('user_id', user.id)
            .eq('counter_id', counter.id)
            .eq('status', 'active')
        activeAlerts = (alertRows ?? []).map((a) => ({
            id: a.id,
            target_price: Number(a.target_price),
            direction: a.direction as 'above' | 'below',
        }))
    }

    // Latest two price rows: [0] = today/most recent, [1] = previous
    // close. Also carries the daily-changing fields the detail-page
    // scraper writes (day_low/day_high/volume/market_cap/pe_ratio).
    const { data: priceRows } = await supabase
        .from('mse_prices')
        .select('price, change_pct, market_cap, pe_ratio, day_low, day_high, volume, price_date')
        .eq('counter_id', counter.id)
        .order('price_date', { ascending: false })
        .limit(2)

    const latest = priceRows?.[0]
    const previous = priceRows?.[1]

    // Slow-changing fundamentals (EPS, DPS, dividend yield, shares
    // outstanding) — overwritten in place by the scraper, one row per
    // counter, not a daily history.
    const { data: fundamentals } = await supabase
        .from('mse_fundamentals')
        .select('eps, dps, dividend_yield, shares_outstanding')
        .eq('counter_id', counter.id)
        .maybeSingle()

    // 52-week high/low + shares traded over the last 3 months, both
    // derived from the same 1-year price history pull.
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const since = oneYearAgo.toISOString().slice(0, 10)

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const sinceThreeMonths = threeMonthsAgo.toISOString().slice(0, 10)

    const { data: history } = await supabase
        .from('mse_prices')
        .select('price, volume, price_date')
        .eq('counter_id', counter.id)
        .gte('price_date', since)

    let week52High: number | null = null
    let week52Low: number | null = null
    let sharesTraded3mo = 0
    for (const row of history ?? []) {
        const p = Number(row.price)
        if (week52High === null || p > week52High) week52High = p
        if (week52Low === null || p < week52Low) week52Low = p
        if (row.price_date >= sinceThreeMonths && row.volume != null) {
            sharesTraded3mo += Number(row.volume)
        }
    }

    // Corporate actions for this counter (Announcements/Reports/
    // Dividends tabs all slice this same set client-side).
    const { data: rawActions } = await supabase
        .from('corporate_actions')
        .select('type, headline, details, action_date, slug')
        .eq('counter_id', counter.id)
        .order('action_date', { ascending: false })
        .limit(100)

    const { data: rawNews } = await supabase
        .from('news_items')
        .select('headline, summary, source_name, source_url, published_at, image_url')
        .eq('counter_id', counter.id)
        .order('published_at', { ascending: false })
        .limit(50)

    const actions = rawActions ?? []
    const newsItems = rawNews ?? []

    const changePct = latest?.change_pct != null ? Number(latest.change_pct) : null
    const isUp = (changePct ?? 0) > 0
    const isDown = (changePct ?? 0) < 0

    const price = latest?.price != null ? Number(latest.price) : null
    const eps = fundamentals?.eps != null ? Number(fundamentals.eps) : null
    const dps = fundamentals?.dps != null ? Number(fundamentals.dps) : null
    const dividendYield = fundamentals?.dividend_yield != null ? Number(fundamentals.dividend_yield) : null

    // Earnings yield = EPS / price. Payout ratio = DPS / EPS. Both
    // computed here rather than stored, so they always match whatever
    // the latest price/fundamentals actually are.
    const earningsYield = eps != null && price ? (eps / price) * 100 : null
    const payoutRatio = eps && dps != null && eps !== 0 ? (dps / eps) * 100 : null

    return (
        <div className="space-y-6">
            {/* Back link */}
            <Link
                href="/stocks"
                className="inline-flex items-center gap-1.5 text-[13px] text-(--color-text-tertiary) no-underline hover:text-(--color-text-primary)"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                All counters
            </Link>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-[22px] font-bold text-(--color-text-primary)">{counter.symbol}</h1>
                        {counter.sector && (
                            <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                style={{ background: 'var(--color-background-warning)', color: 'var(--color-text-warning)' }}
                            >
                                {counter.sector}
                            </span>
                        )}
                        <WatchlistButton
                            counterId={counter.id}
                            isLoggedIn={!!user}
                            initialWatched={isWatched}
                            size={19}
                        />
                    </div>
                    <p className="mt-0.5 text-[14px] text-(--color-text-secondary)">{counter.company_name}</p>
                </div>

                {latest && (
                    <div className="text-right">
                        <p className="text-[24px] font-semibold text-(--color-text-primary) font-(family-name:--font-mono)">
                            MK {formatPrice(Number(latest.price))}
                        </p>
                        {changePct != null && (
                            <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold font-(family-name:--font-mono)"
                                style={{
                                    background: isUp ? 'var(--color-background-success)' : isDown ? 'var(--color-background-danger)' : 'transparent',
                                    color: isUp ? 'var(--color-text-success)' : isDown ? 'var(--color-text-danger)' : 'var(--color-text-tertiary)',
                                }}
                            >
                                {isUp && <TrendingUp size={11} aria-hidden="true" />}
                                {isDown && <TrendingDown size={11} aria-hidden="true" />}
                                {isUp ? '+' : ''}{changePct.toFixed(2)}%
                            </span>
                        )}
                        {latest.price_date && (
                            <p className="mt-1 text-[11px] text-(--color-text-tertiary)">
                                As of {formatDate(latest.price_date)}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <PriceAlertButton
                counterId={counter.id}
                symbol={counter.symbol}
                isLoggedIn={!!user}
                initialAlerts={activeAlerts}
            />

            <CounterOverviewTabs
                symbol={counter.symbol}
                overview={{
                    open: null, // afx.kwayisi.org rarely publishes this — see file header note
                    prevClose: previous?.price != null ? Number(previous.price) : null,
                    dayHigh: latest?.day_high != null ? Number(latest.day_high) : null,
                    dayLow: latest?.day_low != null ? Number(latest.day_low) : null,
                    volume: latest?.volume != null ? Number(latest.volume) : null,
                    sharesTraded3mo: sharesTraded3mo || null,
                    peRatio: latest?.pe_ratio != null ? Number(latest.pe_ratio) : null,
                    marketCap: formatMarketCap(latest?.market_cap != null ? Number(latest.market_cap) : null),
                    eps,
                    earningsYield,
                    dividendYield,
                    payoutRatio,
                    week52High,
                    week52Low,
                }}
                actions={actions}
                newsItems={newsItems}
            />
        </div>
    )
}