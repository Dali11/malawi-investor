// app/(public)/markets/corporate-actions/CorporateActionsList.tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

export type CorporateActionRow = {
    symbol: string | null
    company_name: string | null
    type: 'Dividend' | 'AGM' | 'Rights Issue' | 'Stock Split' | 'Report' | 'Announcement'
    headline: string
    details: string | null
    date: string // ISO
    slug: string | null
}

const TYPE_COLORS: Record<CorporateActionRow['type'], { bg: string; text: string }> = {
    Dividend: { bg: 'var(--color-background-success)', text: 'var(--color-text-success)' },
    AGM: { bg: 'var(--color-background-info)', text: 'var(--color-text-info)' },
    'Rights Issue': { bg: 'var(--color-background-warning)', text: 'var(--color-text-warning)' },
    'Stock Split': { bg: 'var(--color-background-warning)', text: 'var(--color-text-warning)' },
    Report: { bg: 'var(--color-background-info)', text: 'var(--color-text-info)' },
    Announcement: { bg: 'var(--color-background-secondary)', text: 'var(--color-text-secondary)' },
}

const TYPE_FILTERS: Array<CorporateActionRow['type'] | 'All'> = [
    'All', 'Dividend', 'AGM', 'Rights Issue', 'Stock Split', 'Report', 'Announcement',
]

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-MW', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function CorporateActionsList({ actions }: { actions: CorporateActionRow[] }) {
    const [type, setType] = useState<typeof TYPE_FILTERS[number]>('All')
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return actions.filter(a => {
            const matchesType = type === 'All' || a.type === type
            const matchesSearch = !q ||
                (a.symbol?.toLowerCase().includes(q) ?? false) ||
                (a.company_name?.toLowerCase().includes(q) ?? false) ||
                a.headline.toLowerCase().includes(q)
            return matchesType && matchesSearch
        })
    }, [actions, type, search])

    return (
        <div className="space-y-3">
            {/* Filters */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-1.5">
                    {TYPE_FILTERS.map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setType(t)}
                            className="rounded-full px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer border-none"
                            style={
                                type === t
                                    ? { background: 'var(--color-text-primary)', color: 'var(--color-background-primary)' }
                                    : { background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' }
                            }
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <input
                    type="search"
                    placeholder="Search by symbol, company or headline…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-3.5 py-2 text-[13px] text-(--color-text-primary) placeholder:text-(--color-text-tertiary) outline-none focus:border-(--color-border-primary) sm:max-w-xs"
                />
            </div>

            {/* List */}
            <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
                {filtered.length === 0 ? (
                    <p className="px-4 py-10 text-center text-[13px] text-(--color-text-tertiary)">
                        No corporate actions match your filters.
                    </p>
                ) : (
                    filtered.map((a, i) => {
                        const { bg, text } = TYPE_COLORS[a.type]
                        return (
                            <div
                                key={i}
                                className={`flex items-start gap-3 px-4 py-3.5 ${i < filtered.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                            >
                                <span
                                    className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                                    style={{ background: bg, color: text }}
                                >
                                    {a.type}
                                </span>
                                <div className="min-w-0 flex-1">
                                    {a.slug ? (
                                        <Link
                                            href={`/markets/corporate-actions/${a.slug}`}
                                            className="text-[13px] text-(--color-text-primary) leading-snug no-underline hover:underline"
                                        >
                                            {a.headline}
                                        </Link>
                                    ) : (
                                            <Link href={`/markets/corporate-actions/${a.slug}`}>
                                                <p className="text-[13px] text-(--color-text-primary) leading-snug">{a.headline}</p>
                                            </Link>
                                    )}
                                    {a.details && (
                                        <Link href={`/markets/corporate-actions/${a.slug}`}>
                                            <p className="mt-0.5 line-clamp-1 text-[12px] text-(--color-text-secondary) leading-snug">{a.details}</p>
                                        </Link>
                                    )}
                                    <p className="mt-1 text-[11px] text-(--color-text-tertiary)">
                                        {a.symbol ? (
                                            <Link
                                                href={`/mse/${a.symbol.toLowerCase()}`}
                                                className="font-semibold text-(--color-text-primary) no-underline hover:underline"
                                            >
                                                {a.symbol}
                                            </Link>
                                        ) : (
                                            <span className="font-semibold text-(--color-text-primary)">MSE</span>
                                        )}
                                        {a.company_name && <> · {a.company_name}</>}
                                        {' · '}
                                        {formatDate(a.date)}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}