// app/(public)/news/NewsFeed.tsx
'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type NewsItemRow = {
    id: number
    symbol: string | null
    headline: string
    summary: string | null
    source_name: string | null
    source_url: string | null
    published_at: string
    image_url: string | null
    category: string
}

const PAGE_SIZE = 12

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-MW', { day: 'numeric', month: 'short', year: 'numeric' })
}

function NewsCard({ n }: { n: NewsItemRow }) {
    const body = (
        <>
            <div className="aspect-[16/10] w-full overflow-hidden bg-(--color-background-tertiary)">
                {n.image_url ? (
                    <img src={n.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-(--color-text-tertiary)">
                        Malawi Investor
                    </div>
                )}
            </div>
            <div className="p-3.5">
                <p className="text-[11px] font-bold tracking-wide text-(--color-text-info) uppercase">{n.category}</p>
                <p className="mt-1 text-[14px] leading-snug font-semibold text-(--color-text-primary) line-clamp-3">
                    {n.headline}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[11px] text-(--color-text-tertiary)">
                    {n.symbol && (
                        <>
                            <Link
                                href={`/stocks/${n.symbol.toLowerCase()}`}
                                onClick={(e) => e.stopPropagation()}
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
        </>
    )

    const cardClasses =
        'block overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) no-underline shadow-(--shadow-card) transition-transform hover:-translate-y-0.5'

    if (n.source_url) {
        return (
            <a href={n.source_url} target="_blank" rel="noopener noreferrer" className={cardClasses}>
                {body}
            </a>
        )
    }
    return <div className={cardClasses}>{body}</div>
}

export function NewsFeed({ items }: { items: NewsItemRow[] }) {
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [page, setPage] = useState(1)

    const categories = useMemo(() => {
        const set = new Set(items.map(n => n.category))
        return ['All', ...Array.from(set)]
    }, [items])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return items.filter(n => {
            if (category !== 'All' && n.category !== category) return false
            if (!q) return true
            return (
                n.headline.toLowerCase().includes(q) ||
                (n.summary ?? '').toLowerCase().includes(q) ||
                (n.symbol ?? '').toLowerCase().includes(q) ||
                (n.source_name ?? '').toLowerCase().includes(q)
            )
        })
    }, [items, search, category])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

    // Reset to page 1 whenever the search or category narrows the result set.
    useEffect(() => { setPage(1) }, [search, category])

    const paged = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return filtered.slice(start, start + PAGE_SIZE)
    }, [filtered, page])

    const topRef = useRef<HTMLDivElement>(null)

    function goToPage(p: number) {
        setPage(p)
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <div className="space-y-4" ref={topRef}>
            <input
                type="search"
                placeholder="Search headlines, symbols or sources…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-3.5 py-2 text-[13px] text-(--color-text-primary) placeholder:text-(--color-text-tertiary) outline-none focus:border-(--color-border-primary) sm:max-w-xs"
            />

            <div className="flex flex-wrap gap-2 border-b-[0.5px] border-(--color-border-tertiary) pb-3">
                {categories.map(c => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`rounded-full px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors ${c === category
                                ? 'bg-(--color-brand) text-[#062012]'
                                : 'border-[0.5px] border-(--color-border-secondary) text-(--color-text-secondary) hover:bg-(--color-background-secondary)'
                            }`}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <p className="px-4 py-10 text-center text-[13px] text-(--color-text-tertiary)">
                    No headlines match your search.
                </p>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {paged.map(n => (
                        <NewsCard key={n.id} n={n} />
                    ))}
                </div>
            )}

            {filtered.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                    <p className="text-[12px] text-(--color-text-tertiary)">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => goToPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) text-(--color-text-secondary) transition-colors hover:bg-(--color-background-secondary) disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                            .map((p, i, arr) => (
                                <span key={p} className="flex items-center">
                                    {i > 0 && arr[i - 1] !== p - 1 && (
                                        <span className="px-1 text-[12px] text-(--color-text-tertiary)">…</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => goToPage(p)}
                                        className={`flex h-8 min-w-8 items-center justify-center rounded-(--border-radius-md) px-2 text-[12px] font-medium transition-colors ${p === page
                                                ? 'bg-(--color-brand) text-[#062012]'
                                                : 'border-[0.5px] border-(--color-border-secondary) text-(--color-text-secondary) hover:bg-(--color-background-secondary)'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                </span>
                            ))}
                        <button
                            type="button"
                            onClick={() => goToPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) text-(--color-text-secondary) transition-colors hover:bg-(--color-background-secondary) disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Next page"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}