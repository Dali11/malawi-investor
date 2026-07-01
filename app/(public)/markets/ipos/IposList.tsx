// app/(public)/markets/ipos/IposList.tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { IpoStatus } from '@/types/database'

export type IpoRow = {
    id: number
    symbol: string | null // set once listed and linked to an mse_counters row
    company_name: string
    sector: string | null
    status: IpoStatus
    offer_price: number | null
    shares_offered: number | null
    min_investment: number | null
    open_date: string | null
    close_date: string | null
    listing_date: string | null
    summary: string
    prospectus_url: string | null
}

const STATUS_COLORS: Record<IpoStatus, { bg: string; text: string }> = {
    Upcoming: { bg: 'var(--color-background-info)', text: 'var(--color-text-info)' },
    Open: { bg: 'var(--color-background-success)', text: 'var(--color-text-success)' },
    Closed: { bg: 'var(--color-background-secondary)', text: 'var(--color-text-secondary)' },
    Listed: { bg: 'var(--color-background-warning)', text: 'var(--color-text-warning)' },
}

const STATUS_FILTERS: Array<IpoStatus | 'All'> = ['All', 'Upcoming', 'Open', 'Closed', 'Listed']

function formatDate(iso: string | null) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('en-MW', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMoney(n: number | null) {
    if (n == null) return null
    return `MK ${n.toLocaleString('en-MW')}`
}

export function IposList({ ipos }: { ipos: IpoRow[] }) {
    const [status, setStatus] = useState<typeof STATUS_FILTERS[number]>('All')
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return ipos.filter(ipo => {
            const matchesStatus = status === 'All' || ipo.status === status
            const matchesSearch = !q ||
                ipo.company_name.toLowerCase().includes(q) ||
                (ipo.sector ?? '').toLowerCase().includes(q) ||
                (ipo.symbol ?? '').toLowerCase().includes(q)
            return matchesStatus && matchesSearch
        })
    }, [ipos, status, search])

    return (
        <div className="space-y-3">
            {/* Filters */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-1.5">
                    {STATUS_FILTERS.map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(s)}
                            className="rounded-full px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer border-none"
                            style={
                                status === s
                                    ? { background: 'var(--color-text-primary)', color: 'var(--color-background-primary)' }
                                    : { background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' }
                            }
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <input
                    type="search"
                    placeholder="Search by company, sector or symbol…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-3.5 py-2 text-[13px] text-(--color-text-primary) placeholder:text-(--color-text-tertiary) outline-none focus:border-(--color-border-primary) sm:max-w-xs"
                />
            </div>

            {/* List */}
            <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
                {filtered.length === 0 ? (
                    <p className="px-4 py-10 text-center text-[13px] text-(--color-text-tertiary)">
                        No IPOs match your filters.
                    </p>
                ) : (
                    filtered.map((ipo, i) => {
                        const { bg, text } = STATUS_COLORS[ipo.status]
                        const dateLabel =
                            ipo.status === 'Upcoming' || ipo.status === 'Open'
                                ? ipo.close_date && `Closes ${formatDate(ipo.close_date)}`
                                : ipo.status === 'Listed'
                                    ? ipo.listing_date && `Listed ${formatDate(ipo.listing_date)}`
                                    : ipo.close_date && `Closed ${formatDate(ipo.close_date)}`

                        return (
                            <div
                                key={ipo.id}
                                className={`flex items-start gap-3 px-4 py-3.5 ${i < filtered.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                            >
                                <span
                                    className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                                    style={{ background: bg, color: text }}
                                >
                                    {ipo.status}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-medium text-(--color-text-primary) leading-snug">
                                        {ipo.symbol ? (
                                            <Link
                                                href={`/mse/${ipo.symbol.toLowerCase()}`}
                                                className="text-(--color-text-primary) no-underline hover:underline"
                                            >
                                                {ipo.company_name}
                                            </Link>
                                        ) : (
                                            ipo.company_name
                                        )}
                                        {ipo.sector && (
                                            <span className="ml-1.5 text-[11px] font-normal text-(--color-text-tertiary)">
                                                · {ipo.sector}
                                            </span>
                                        )}
                                    </p>
                                    <p className="mt-0.5 text-[12px] text-(--color-text-secondary) leading-snug">
                                        {ipo.summary}
                                    </p>
                                    <p className="mt-1 flex flex-wrap gap-x-1.5 text-[11px] text-(--color-text-tertiary)">
                                        {ipo.offer_price != null && <span>{formatMoney(ipo.offer_price)}/share</span>}
                                        {ipo.min_investment != null && <span>· Min {formatMoney(ipo.min_investment)}</span>}
                                        {dateLabel && <span>· {dateLabel}</span>}
                                        {ipo.prospectus_url && (
                                            <a
                                                href={ipo.prospectus_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-(--color-text-primary) no-underline hover:underline"
                                            >
                                                · Prospectus
                                            </a>
                                        )}
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
