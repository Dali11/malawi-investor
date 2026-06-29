'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, X, TrendingUp, BookOpen, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type Results = {
    articles: any[]
    counters: any[]
    glossary: any[]
}

export default function SearchBox() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Results | null>(null)
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const boxRef = useRef<HTMLDivElement>(null)

    // Debounced search
    useEffect(() => {
        if (query.length < 2) { setResults(null); return }
        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
                const data = await res.json()
                setResults(data)
                setOpen(true)
            } catch { /* silent */ }
            finally { setLoading(false) }
        }, 300)
        return () => clearTimeout(timer)
    }, [query])

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const hasResults = results && (
        results.articles.length > 0 ||
        results.counters.length > 0 ||
        results.glossary.length > 0
    )

    const isEmpty = results && !hasResults

    function clear() {
        setQuery('')
        setResults(null)
        setOpen(false)
        inputRef.current?.focus()
    }

    return (
        <div ref={boxRef} className="relative hidden sm:block">
            {/* Input */}
            <Search
                className="absolute top-1/2 left-2.5 -translate-y-1/2 text-(--color-text-tertiary) pointer-events-none"
                size={14}
                aria-hidden="true"
            />
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => results && setOpen(true)}
                placeholder="Symbols, articles, glossary…"
                className="h-8 w-[220px] rounded-(--border-radius-md) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-secondary) pl-8 pr-7 text-xs outline-none focus:border-(--color-border-secondary) focus:bg-(--color-background-primary) transition-colors"
            />
            {query && (
                <button
                    onClick={clear}
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-(--color-text-tertiary) hover:text-(--color-text-primary)"
                    aria-label="Clear search"
                >
                    <X size={12} />
                </button>
            )}

            {/* Dropdown */}
            {open && query.length >= 2 && (
                <div className="absolute top-full right-0 mt-1.5 w-[340px] rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-lg z-50 overflow-hidden">

                    {loading && (
                        <div className="px-4 py-3 text-xs text-(--color-text-tertiary)">
                            Searching…
                        </div>
                    )}

                    {isEmpty && !loading && (
                        <div className="px-4 py-5 text-center text-xs text-(--color-text-tertiary)">
                            No results for <span className="font-semibold text-(--color-text-primary)">"{query}"</span>
                        </div>
                    )}

                    {hasResults && !loading && (
                        <>
                            {/* MSE Counters */}
                            {results.counters.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 border-b-[0.5px] border-(--color-border-tertiary) px-4 py-2 bg-(--color-background-secondary)">
                                        <TrendingUp size={11} className="text-(--color-text-tertiary)" />
                                        <span className="text-[10px] font-bold tracking-widest text-(--color-text-tertiary) uppercase">Counters</span>
                                    </div>
                                    {results.counters.map((c: any) => (
                                        <Link
                                            key={c.symbol}
                                            href={`/mse/${c.symbol.toLowerCase()}`}
                                            onClick={() => setOpen(false)}
                                            className="flex items-center justify-between px-4 py-2.5 no-underline hover:bg-(--color-background-secondary) border-b-[0.5px] border-(--color-border-tertiary) last:border-0"
                                        >
                                            <span className="text-[13px] font-bold text-(--color-text-primary)">{c.symbol}</span>
                                            <span className="text-[12px] text-(--color-text-secondary)">{c.company_name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Articles */}
                            {results.articles.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 border-b-[0.5px] border-(--color-border-tertiary) px-4 py-2 bg-(--color-background-secondary)">
                                        <FileText size={11} className="text-(--color-text-tertiary)" />
                                        <span className="text-[10px] font-bold tracking-widest text-(--color-text-tertiary) uppercase">Analysis</span>
                                    </div>
                                    {results.articles.map((a: any) => (
                                        <Link
                                            key={a.id}
                                            href={`/news/${a.id}`}
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-(--color-background-secondary) border-b-[0.5px] border-(--color-border-tertiary) last:border-0"
                                        >
                                            {/* Thumbnail */}
                                            <div className="h-9 w-12 shrink-0 overflow-hidden rounded bg-[#0c1f3d]">
                                                {a.image_url
                                                    ? <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                                                    : <div className="h-full w-full" />
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[12px] font-semibold text-(--color-text-primary)">{a.title}</p>
                                                <p className="text-[10px] text-(--color-text-tertiary)">
                                                    {a.mse_counters?.symbol && (
                                                        <span className="mr-1.5 font-bold text-(--color-text-info)">{a.mse_counters.symbol}</span>
                                                    )}
                                                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Glossary */}
                            {results.glossary.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 border-b-[0.5px] border-(--color-border-tertiary) px-4 py-2 bg-(--color-background-secondary)">
                                        <BookOpen size={11} className="text-(--color-text-tertiary)" />
                                        <span className="text-[10px] font-bold tracking-widest text-(--color-text-tertiary) uppercase">Glossary</span>
                                    </div>
                                    {results.glossary.map((g: any) => (
                                        <Link
                                            key={g.id}
                                            href={`/glossary#${g.term.toLowerCase().replace(/\s+/g, '-')}`}
                                            onClick={() => setOpen(false)}
                                            className="block px-4 py-2.5 no-underline hover:bg-(--color-background-secondary) border-b-[0.5px] border-(--color-border-tertiary) last:border-0"
                                        >
                                            <p className="text-[12px] font-semibold text-(--color-text-primary)">{g.term}</p>
                                            <p className="mt-0.5 truncate text-[11px] text-(--color-text-tertiary)">{g.definition}</p>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* View all */}
                            <Link
                                href={`/search?q=${encodeURIComponent(query)}`}
                                onClick={() => setOpen(false)}
                                className="block border-t-[0.5px] border-(--color-border-tertiary) px-4 py-2.5 text-center text-[11px] font-medium text-(--color-text-info) no-underline hover:underline"
                            >
                                View all results for "{query}" →
                            </Link>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}