// app/(public)/news/NewsFeed.tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export type NewsItemRow = {
    id: number
    symbol: string | null
    headline: string
    summary: string | null
    source_name: string | null
    source_url: string | null
    published_at: string
    image_url: string | null
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-MW', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function NewsFeed({ items }: { items: NewsItemRow[] }) {
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return items
        return items.filter(n =>
            n.headline.toLowerCase().includes(q) ||
            (n.summary ?? '').toLowerCase().includes(q) ||
            (n.symbol ?? '').toLowerCase().includes(q) ||
            (n.source_name ?? '').toLowerCase().includes(q),
        )
    }, [items, search])

    return (
        <div className="space-y-3">
            <input
                type="search"
                placeholder="Search headlines, symbols or sources…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-3.5 py-2 text-[13px] text-(--color-text-primary) placeholder:text-(--color-text-tertiary) outline-none focus:border-(--color-border-primary) sm:max-w-xs"
            />

            <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
                {filtered.length === 0 ? (
                    <p className="px-4 py-10 text-center text-[13px] text-(--color-text-tertiary)">
                        No headlines match your search.
                    </p>
                ) : (
                    filtered.map((n, i) => (
                        <div
                            key={n.id}
                            className={`flex items-start gap-3 px-4 py-3.5 ${i < filtered.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                        >
                            {n.image_url && (
                                <img
                                    src={n.image_url}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-(--border-radius-md) object-cover"
                                />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-medium text-(--color-text-primary) leading-snug">
                                    {n.source_url ? (
                                        <a
                                            href={n.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-(--color-text-primary) no-underline hover:underline"
                                        >
                                            {n.headline}
                                            <ExternalLink size={11} className="shrink-0 text-(--color-text-tertiary)" />
                                        </a>
                                    ) : (
                                        n.headline
                                    )}
                                </p>
                                {n.summary && (
                                    <p className="mt-0.5 text-[12px] text-(--color-text-secondary) leading-snug">
                                        {n.summary}
                                    </p>
                                )}
                                <p className="mt-1 flex flex-wrap gap-x-1.5 text-[11px] text-(--color-text-tertiary)">
                                    {n.symbol && (
                                        <>
                                            <Link
                                                href={`/stocks/${n.symbol.toLowerCase()}`}
                                                className="font-semibold text-(--color-text-primary) no-underline hover:underline"
                                            >
                                                {n.symbol}
                                            </Link>
                                            <span>·</span>
                                        </>
                                    )}
                                    {n.source_name && <span>{n.source_name} ·</span>}
                                    <span>{formatDate(n.published_at)}</span>
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}