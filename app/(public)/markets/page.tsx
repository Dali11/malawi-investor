// app/(public)/markets/page.tsx
// Market Overview — the dashboard entry point for the MSE markets section.
// All data is fetched server-side from Supabase; charts load client-side
// via the existing /api/chart-data endpoint + TrendChart component.

import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    Building2,
    Activity,
    Minus,
} from 'lucide-react'
import Link from 'next/link'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { MarketMovers } from '@/components/home/MarketMovers'

import { TrendChart } from '@/components/home/TrendChart'
import { getSymbol, type PriceMover } from '@/types/home'
import { MarketStatCard } from '@/components/markets/MarketStatCard'
import { RecentCorporateActions } from '@/components/markets/RecentCorporateActions'
import { MostActiveCounters } from '@/components/markets/MostActiveCounters'

// ─── helpers ─────────────────────────────────────────────────────────────────

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

function formatMarketCap(n: number | null | undefined): string {
    if (!n) return '—'
    if (n >= 1_000_000_000_000) return `MK ${(n / 1_000_000_000_000).toFixed(2)}T`
    if (n >= 1_000_000_000) return `MK ${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `MK ${(n / 1_000_000).toFixed(0)}M`
    return `MK ${n.toLocaleString('en')}`
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function MarketOverviewPage() {
    const supabase = getServiceClient()

    // Latest price row per counter (up to 64 rows, deduplicated below)
    const { data: rawPrices } = await supabase
        .from('mse_prices')
        .select('price, change_pct, market_cap, pe_ratio, price_date, counter_id, mse_counters(id, symbol, company_name, sector)')
        .order('price_date', { ascending: false })
        .limit(64)

    // Deduplicate: keep only the most recent row per counter
    const seen = new Set<number>()
    const latest = (rawPrices ?? []).filter((p: any) => {
        const id = p.counter_id
        if (seen.has(id)) return false
        seen.add(id)
        return true
    })

    // Recent corporate actions for the widget (latest 6, with symbol joined)
    const { data: rawActions } = await supabase
        .from('corporate_actions')
        .select('type, headline, action_date, mse_counters(symbol)')
        .order('action_date', { ascending: false })
        .limit(6)

    const recentActions = (rawActions ?? []).map((a: any) => ({
        symbol: a.mse_counters?.symbol ?? '—',
        type: a.type,
        headline: a.headline,
        date: a.action_date,
    }))

    // ── Derived stats ──────────────────────────────────────────────────────
    const gainers = latest.filter((p: any) => Number(p.change_pct) > 0)
    const losers = latest.filter((p: any) => Number(p.change_pct) < 0)
    const unchanged = latest.filter((p: any) => Number(p.change_pct) === 0)

    const totalMarketCap = latest.reduce((sum: number, p: any) => sum + Number(p.market_cap ?? 0), 0)

    const lastUpdated = latest[0]?.price_date
        ? new Date(latest[0].price_date).toLocaleDateString('en-MW', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
        : null

    // Top movers for MarketMovers widget (same shape as home page)
    const topGainers: PriceMover[] = gainers
        .sort((a: any, b: any) => Number(b.change_pct) - Number(a.change_pct))
        .slice(0, 5)
        .map((p: any) => ({ price: p.price, change_pct: p.change_pct, mse_counters: p.mse_counters }))

    const topLosers: PriceMover[] = losers
        .sort((a: any, b: any) => Number(a.change_pct) - Number(b.change_pct))
        .slice(0, 5)
        .map((p: any) => ({ price: p.price, change_pct: p.change_pct, mse_counters: p.mse_counters }))

    // Most active: sort by market_cap desc as proxy until volume column exists
    const mostActive = latest
        .sort((a: any, b: any) => Number(b.market_cap ?? 0) - Number(a.market_cap ?? 0))
        .slice(0, 6)
        .map((p: any) => ({
            symbol: p.mse_counters?.symbol ?? '—',
            company_name: p.mse_counters?.company_name ?? '',
            price: Number(p.price),
            change_pct: p.change_pct,
            market_cap: p.market_cap,
        }))

    // Overall market direction
    const netDirection = gainers.length > losers.length
        ? 'up'
        : losers.length > gainers.length
            ? 'down'
            : 'flat'

    return (
        <div className="space-y-6">
            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-[20px] font-semibold text-(--color-text-primary)">
                        Market Overview
                    </h1>
                    <p className="mt-0.5 text-[13px] text-(--color-text-tertiary)">
                        Malawi Stock Exchange — all prices in Malawian Kwacha (MK)
                        {lastUpdated && <span> · Last updated {lastUpdated}</span>}
                    </p>
                </div>
                <Link
                    href="/mse"
                    className="rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) px-3.5 py-1.5 text-[13px] font-medium text-(--color-text-primary) no-underline transition-colors hover:bg-(--color-background-secondary)"
                >
                    View all stocks →
                </Link>
            </div>

            {/* ── Stat cards row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MarketStatCard
                    label="Listed counters"
                    value={String(latest.length)}
                    sub="on the MSE"
                    icon={Building2}
                    sentiment="neutral"
                />
                <MarketStatCard
                    label="Total market cap"
                    value={formatMarketCap(totalMarketCap)}
                    sub={totalMarketCap > 0 ? 'across all counters' : 'data pending'}
                    icon={BarChart3}
                    sentiment="neutral"
                />
                <MarketStatCard
                    label="Gainers today"
                    value={String(gainers.length)}
                    sub={`${unchanged.length} unchanged`}
                    icon={TrendingUp}
                    sentiment="positive"
                />
                <MarketStatCard
                    label="Losers today"
                    value={String(losers.length)}
                    sub={`of ${latest.length} counters`}
                    icon={TrendingDown}
                    sentiment={losers.length > gainers.length ? 'negative' : 'neutral'}
                />
            </div>

            {/* ── MSE Composite chart ─────────────────────────────────────── */}
            <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
                <div className="flex items-center justify-between border-b-[0.5px] border-(--color-border-tertiary) px-4 py-2.5">
                    <div className="flex items-center gap-3">
                        <p className="text-[11px] font-bold tracking-wider text-(--color-text-tertiary) uppercase">
                            MSE Composite Index
                        </p>
                        {netDirection !== 'flat' && (
                            <span
                                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{
                                    background: netDirection === 'up'
                                        ? 'var(--color-background-success)'
                                        : 'var(--color-background-danger)',
                                    color: netDirection === 'up'
                                        ? 'var(--color-text-success)'
                                        : 'var(--color-text-danger)',
                                }}
                            >
                                {netDirection === 'up'
                                    ? <TrendingUp size={10} aria-hidden="true" />
                                    : <TrendingDown size={10} aria-hidden="true" />}
                                {netDirection === 'up' ? 'Broad advance' : 'Broad decline'}
                            </span>
                        )}
                    </div>
                    <Link
                        href="/markets/indices"
                        className="text-[12px] text-(--color-text-tertiary) no-underline transition-colors hover:text-(--color-text-primary)"
                    >
                        Full indices →
                    </Link>
                </div>
                <div className="p-4">
                    <TrendChart symbol={null} />
                </div>
            </div>

            {/* ── Breadth bar ─────────────────────────────────────────────── */}
            {latest.length > 0 && (
                <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-4 shadow-(--shadow-card)">
                    <p className="mb-2 text-[11px] font-bold tracking-wider text-(--color-text-tertiary) uppercase">
                        Market breadth
                    </p>
                    <div className="flex h-3 w-full overflow-hidden rounded-full">
                        <div
                            className="h-full transition-all"
                            style={{
                                width: `${(gainers.length / latest.length) * 100}%`,
                                background: 'var(--color-text-success)',
                                opacity: 0.8,
                            }}
                        />
                        <div
                            className="h-full transition-all"
                            style={{
                                width: `${(unchanged.length / latest.length) * 100}%`,
                                background: 'var(--color-border-secondary)',
                            }}
                        />
                        <div
                            className="h-full transition-all"
                            style={{
                                width: `${(losers.length / latest.length) * 100}%`,
                                background: 'var(--color-text-danger)',
                                opacity: 0.8,
                            }}
                        />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-[12px]">
                        <span style={{ color: 'var(--color-text-success)' }}>
                            ▲ {gainers.length} advancing
                        </span>
                        <span className="text-(--color-text-tertiary)">
                            — {unchanged.length} unchanged
                        </span>
                        <span style={{ color: 'var(--color-text-danger)' }}>
                            ▼ {losers.length} declining
                        </span>
                    </div>
                </div>
            )}

            {/* ── Movers + Corporate Actions row ──────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
                <MarketMovers gainers={topGainers} losers={topLosers} />
                <RecentCorporateActions actions={recentActions.length > 0 ? recentActions : undefined} />
            </div>

            {/* ── Most active counters ─────────────────────────────────────── */}
            <MostActiveCounters counters={mostActive} />

            {/* ── Quick links to other sections ───────────────────────────── */}
            <div>
                <p className="mb-3 text-[11px] font-bold tracking-wider text-(--color-text-tertiary) uppercase">
                    Explore markets
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {[
                        { label: 'Stocks', href: '/mse', desc: 'All 16 MSE counters' },
                        { label: 'Bonds', href: '/markets/bonds', desc: 'T-bills & govt bonds' },
                        { label: 'Indices', href: '/markets/indices', desc: 'MASI & DSI charts' },
                        { label: 'Screener', href: '/markets/screeners', desc: 'Filter by P/E, cap, sector' },
                        { label: 'Corporate Actions', href: '/markets/corporate-actions', desc: 'Dividends & rights' },
                        { label: 'IPOs', href: '/markets/ipos', desc: 'Upcoming listings' },
                        { label: 'Calendar', href: '/markets/calendar', desc: 'AGMs & key dates' },
                    ].map(({ label, href, desc }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col gap-0.5 rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) px-3.5 py-3 no-underline shadow-(--shadow-card) transition-all hover:shadow-(--shadow-card-hover) hover:border-(--color-border-secondary)"
                        >
                            <span className="text-[13px] font-semibold text-(--color-text-primary)">{label}</span>
                            <span className="text-[11px] text-(--color-text-tertiary)">{desc}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}