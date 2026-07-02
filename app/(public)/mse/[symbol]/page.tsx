// app/(public)/mse/[symbol]/page.tsx
// Individual counter detail page — price, key stats, trend chart and
// that counter's corporate actions history (dividends, AGMs, rights
// issues, splits, announcements) pulled from the `corporate_actions`
// table. Linked to from /mse and corporate action rows.

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Bell } from 'lucide-react'
import { MarketStatCard } from '@/components/markets/MarketStatCard'
import { TrendChart } from '@/components/home/TrendChart'

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

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
    Dividend: { bg: 'var(--color-background-success)', text: 'var(--color-text-success)' },
    AGM: { bg: 'var(--color-background-info)', text: 'var(--color-text-info)' },
    'Rights Issue': { bg: 'var(--color-background-warning)', text: 'var(--color-text-warning)' },
    'Stock Split': { bg: 'var(--color-background-warning)', text: 'var(--color-text-warning)' },
    Announcement: { bg: 'var(--color-background-secondary)', text: 'var(--color-text-secondary)' },
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

    const { data: counter } = await supabase
        .from('mse_counters')
        .select('id, symbol, company_name, sector')
        .ilike('symbol', symbol)
        .single()

    if (!counter) notFound()

    // Latest price row
    const { data: priceRows } = await supabase
        .from('mse_prices')
        .select('price, change_pct, market_cap, pe_ratio, price_date')
        .eq('counter_id', counter.id)
        .order('price_date', { ascending: false })
        .limit(1)

    const latest = priceRows?.[0]

    // 52-week high/low
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const since = oneYearAgo.toISOString().slice(0, 10)

    const { data: history } = await supabase
        .from('mse_prices')
        .select('price')
        .eq('counter_id', counter.id)
        .gte('price_date', since)

    let week52High: number | null = null
    let week52Low: number | null = null
    for (const row of history ?? []) {
        const p = Number(row.price)
        if (week52High === null || p > week52High) week52High = p
        if (week52Low === null || p < week52Low) week52Low = p
    }

    // Corporate actions for this counter
    const { data: rawActions } = await supabase
        .from('corporate_actions')
        .select('type, headline, details, action_date')
        .eq('counter_id', counter.id)
        .order('action_date', { ascending: false })
        .limit(50)

    const actions = rawActions ?? []

    const changePct = latest?.change_pct != null ? Number(latest.change_pct) : null
    const isUp = (changePct ?? 0) > 0
    const isDown = (changePct ?? 0) < 0

    return (
        <div className="space-y-6">
            {/* Back link */}
            <Link
                href="/mse"
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

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MarketStatCard
                    label="P/E ratio"
                    value={latest?.pe_ratio != null ? Number(latest.pe_ratio).toFixed(1) : '—'}
                    icon={BarChart3}
                    sentiment="neutral"
                />
                <MarketStatCard
                    label="Market cap"
                    value={formatMarketCap(latest?.market_cap != null ? Number(latest.market_cap) : null)}
                    icon={BarChart3}
                    sentiment="neutral"
                />
                <MarketStatCard
                    label="52-wk high"
                    value={week52High != null ? formatPrice(week52High) : '—'}
                    icon={TrendingUp}
                    sentiment="positive"
                />
                <MarketStatCard
                    label="52-wk low"
                    value={week52Low != null ? formatPrice(week52Low) : '—'}
                    icon={TrendingDown}
                    sentiment="negative"
                />
            </div>

            {/* Chart */}
            <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-4 shadow-(--shadow-card)">
                <TrendChart symbol={counter.symbol} />
            </div>

            {/* Corporate actions for this counter */}
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <Bell size={14} className="text-(--color-text-tertiary)" aria-hidden="true" />
                    <h2 className="text-[13px] font-bold tracking-wide text-(--color-text-tertiary) uppercase">
                        Corporate actions
                    </h2>
                </div>

                {actions.length === 0 ? (
                    <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) px-4 py-8 text-center shadow-(--shadow-card)">
                        <p className="text-[13px] text-(--color-text-tertiary)">
                            No corporate actions recorded yet for {counter.symbol}.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
                        {actions.map((a, i) => {
                            const { bg, text } = TYPE_COLORS[a.type] ?? TYPE_COLORS.Announcement
                            return (
                                <div
                                    key={i}
                                    className={`flex items-start gap-3 px-4 py-3.5 ${i < actions.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                                >
                                    <span
                                        className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                                        style={{ background: bg, color: text }}
                                    >
                                        {a.type}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] text-(--color-text-primary) leading-snug">{a.headline}</p>
                                        {a.details && (
                                            <p className="mt-0.5 text-[12px] text-(--color-text-secondary) leading-snug">{a.details}</p>
                                        )}
                                        <p className="mt-1 text-[11px] text-(--color-text-tertiary)">{formatDate(a.action_date)}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}