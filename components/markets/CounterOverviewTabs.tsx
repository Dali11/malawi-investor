// components/markets/CounterOverviewTabs.tsx
// Single tab bar driving the /mse/[symbol] page: Market overview (stats +
// price/volume chart), Announcements, News, Reports, Dividends. All data
// is fetched server-side by the page and passed in as props — this
// component only owns which tab is active.
'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { TrendChart } from '@/components/home/TrendChart'

type Action = {
    type: string
    headline: string
    details: string | null
    action_date: string
}

type NewsItem = {
    headline: string
    summary: string | null
    source_name: string | null
    source_url: string | null
    published_at: string
}

type Overview = {
    open: number | null
    prevClose: number | null
    dayHigh: number | null
    dayLow: number | null
    volume: number | null
    sharesTraded3mo: number | null
    peRatio: number | null
    marketCap: string
    eps: number | null
    earningsYield: number | null
    dividendYield: number | null
    payoutRatio: number | null
    week52High: number | null
    week52Low: number | null
}

const TABS = [
    { key: 'overview', label: 'Market overview' },
    { key: 'ann', label: 'Announcements' },
    { key: 'news', label: 'News' },
    { key: 'reports', label: 'Reports' },
    { key: 'div', label: 'Dividends' },
] as const

type TabKey = (typeof TABS)[number]['key']

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
    Dividend: { bg: 'var(--color-background-success)', text: 'var(--color-text-success)' },
    AGM: { bg: 'var(--color-background-info)', text: 'var(--color-text-info)' },
    'Rights Issue': { bg: 'var(--color-background-warning)', text: 'var(--color-text-warning)' },
    'Stock Split': { bg: 'var(--color-background-warning)', text: 'var(--color-text-warning)' },
    Announcement: { bg: 'var(--color-background-tertiary)', text: 'var(--color-text-secondary)' },
    Report: { bg: 'var(--color-background-info)', text: 'var(--color-text-info)' },
    News: { bg: 'var(--color-background-info)', text: 'var(--color-text-info)' },
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-MW', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatPrice(n: number | null) {
    if (n == null) return '—'
    return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatCompact(n: number | null) {
    if (n == null) return '—'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return n.toLocaleString('en')
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) px-4 py-8 text-center shadow-(--shadow-card)">
            <p className="text-[13px] text-(--color-text-tertiary)">{message}</p>
        </div>
    )
}

function StatRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
    return (
        <div
            className={`flex items-center justify-between py-2.5 ${last ? '' : 'border-b-[0.5px] border-(--color-border-tertiary)'}`}
        >
            <span className="text-[13px] text-(--color-text-secondary)">{label}</span>
            <span className="text-[13px] font-medium text-(--color-text-primary) font-(family-name:--font-mono)">
                {value}
            </span>
        </div>
    )
}

function StatList({ stats }: { stats: { label: string; value: string }[] }) {
    const mid = Math.ceil(stats.length / 2)
    const left = stats.slice(0, mid)
    const right = stats.slice(mid)

    return (
        <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) px-4 shadow-(--shadow-card) sm:px-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8">
                <div>
                    {left.map((s, i) => (
                        <StatRow key={s.label} label={s.label} value={s.value} last={i === left.length - 1} />
                    ))}
                </div>
                <div>
                    {right.map((s, i) => (
                        <StatRow key={s.label} label={s.label} value={s.value} last={i === right.length - 1} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function ActionList({ actions, emptyMessage }: { actions: Action[]; emptyMessage: string }) {
    if (actions.length === 0) return <EmptyState message={emptyMessage} />
    return (
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
    )
}

function NewsList({ items }: { items: NewsItem[] }) {
    if (items.length === 0) return <EmptyState message="No news recorded yet for this counter." />
    return (
        <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
            {items.map((n, i) => (
                <div
                    key={i}
                    className={`flex items-start gap-3 px-4 py-3.5 ${i < items.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                >
                    <span
                        className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                        style={{ background: TYPE_COLORS.News.bg, color: TYPE_COLORS.News.text }}
                    >
                        News
                    </span>
                    <div className="min-w-0 flex-1">
                        {n.source_url ? (
                            <a
                                href={n.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[13px] text-(--color-text-primary) leading-snug hover:underline"
                            >
                                {n.headline}
                            </a>
                        ) : (
                            <p className="text-[13px] text-(--color-text-primary) leading-snug">{n.headline}</p>
                        )}
                        {n.summary && (
                            <p className="mt-0.5 text-[12px] text-(--color-text-secondary) leading-snug">{n.summary}</p>
                        )}
                        <p className="mt-1 text-[11px] text-(--color-text-tertiary)">
                            {n.source_name ? `${n.source_name} · ` : ''}
                            {formatDate(n.published_at)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}

export function CounterOverviewTabs({
    symbol,
    overview,
    actions,
    newsItems,
}: {
    symbol: string
    overview: Overview
    actions: Action[]
    newsItems: NewsItem[]
}) {
    const [tab, setTab] = useState<TabKey>('overview')

    const announcements = actions.filter((a) => !['Dividend', 'Report'].includes(a.type))
    const reports = actions.filter((a) => a.type === 'Report')
    const dividends = actions.filter((a) => a.type === 'Dividend')

    return (
        <div>
            {/* Tab bar */}
            <div className="mb-5 flex gap-1 overflow-x-auto border-b-[0.5px] border-(--color-border-tertiary)">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`shrink-0 border-b-2 px-3.5 py-2.5 text-[13px] whitespace-nowrap transition-colors ${tab === t.key
                                ? 'border-(--color-text-primary) font-medium text-(--color-text-primary)'
                                : 'border-transparent text-(--color-text-secondary) hover:text-(--color-text-primary)'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'overview' && (
                <div className="space-y-5">
                    {/* Open / prev close / day range strip */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2 border-b-[0.5px] border-(--color-border-tertiary) pb-4 text-[12px] text-(--color-text-secondary)">
                        <span>Open <strong className="font-medium text-(--color-text-primary)">{formatPrice(overview.open)}</strong></span>
                        <span>Prev close <strong className="font-medium text-(--color-text-primary)">{formatPrice(overview.prevClose)}</strong></span>
                        <span>Day high <strong className="font-medium text-(--color-text-primary)">{formatPrice(overview.dayHigh)}</strong></span>
                        <span>Day low <strong className="font-medium text-(--color-text-primary)">{formatPrice(overview.dayLow)}</strong></span>
                    </div>

                    {/* Stat list */}
                    <StatList
                        stats={[
                            { label: 'Volume', value: formatCompact(overview.volume) },
                            { label: 'Shares traded 3mo', value: formatCompact(overview.sharesTraded3mo) },
                            { label: 'P/E ratio', value: overview.peRatio != null ? overview.peRatio.toFixed(1) : '—' },
                            { label: 'Market cap', value: overview.marketCap },
                            { label: 'EPS', value: overview.eps != null ? overview.eps.toFixed(2) : '—' },
                            { label: 'Earnings yield', value: overview.earningsYield != null ? `${overview.earningsYield.toFixed(2)}%` : '—' },
                            { label: 'Dividend yield', value: overview.dividendYield != null ? `${overview.dividendYield.toFixed(2)}%` : '—' },
                            { label: 'Payout ratio', value: overview.payoutRatio != null ? `${overview.payoutRatio.toFixed(0)}%` : '—' },
                            { label: '52-wk high', value: formatPrice(overview.week52High) },
                            { label: '52-wk low', value: formatPrice(overview.week52Low) },
                        ]}
                    />

                    {/* Price + volume chart */}
                    <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-4 shadow-(--shadow-card)">
                        <TrendChart symbol={symbol} showVolume defaultRange="6M" />
                    </div>
                </div>
            )}

            {tab === 'ann' && (
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <Bell size={14} className="text-(--color-text-tertiary)" aria-hidden="true" />
                        <h2 className="text-[13px] font-bold tracking-wide text-(--color-text-tertiary) uppercase">Announcements</h2>
                    </div>
                    <ActionList actions={announcements} emptyMessage={`No announcements recorded yet for ${symbol}.`} />
                </div>
            )}

            {tab === 'news' && <NewsList items={newsItems} />}

            {tab === 'reports' && (
                <ActionList actions={reports} emptyMessage={`No reports recorded yet for ${symbol}.`} />
            )}

            {tab === 'div' && (
                <ActionList actions={dividends} emptyMessage={`No dividend history recorded yet for ${symbol}.`} />
            )}
        </div>
    )
}