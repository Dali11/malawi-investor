// components/markets/StocksTable.tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export type StockRow = {
    symbol: string
    company_name: string
    sector: string
    price: number
    change_pct: number | null
    volume: number | null
    pe_ratio: number | null
    market_cap: number | null
    week52_high: number | null
    week52_low: number | null
    price_date: string
}

type SortKey = keyof StockRow
type SortDir = 'asc' | 'desc'

function formatPrice(n: number) {
    return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatVolume(n: number | null) {
    if (n == null) return '—'
    if (n === 0) return '0'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toLocaleString('en')
}

function formatMarketCap(n: number | null) {
    if (!n) return '—'
    if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T`
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`
    return n.toLocaleString('en')
}

function Week52Bar({ price, low, high }: { price: number; low: number | null; high: number | null }) {
    if (!low || !high || high === low) return <span className="text-(--color-text-tertiary)">—</span>
    const pct = Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100))
    return (
        <div className="flex flex-col gap-0.5 min-w-[80px]">
            <div className="relative h-1 w-full rounded-full bg-(--color-background-tertiary)">
                <div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ width: `${pct}%`, background: 'var(--color-text-warning)' }}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-2.5 w-0.5 rounded-full bg-(--color-text-primary)"
                    style={{ left: `calc(${pct}% - 1px)` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-(--color-text-tertiary) font-(family-name:--font-mono)">
                <span>{formatPrice(low)}</span>
                <span>{formatPrice(high)}</span>
            </div>
        </div>
    )
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
    if (col !== sortKey) return <ChevronsUpDown size={11} className="opacity-30" />
    return sortDir === 'asc'
        ? <ChevronUp size={11} className="text-(--color-text-warning)" />
        : <ChevronDown size={11} className="text-(--color-text-warning)" />
}

type ColDef = {
    key: SortKey
    label: string
    align: 'left' | 'right'
    hide?: 'sm' | 'md' | 'lg'  // hide below this breakpoint
}

const COLUMNS: ColDef[] = [
    { key: 'symbol', label: 'Symbol', align: 'left' },
    { key: 'company_name', label: 'Company', align: 'left', hide: 'sm' },
    { key: 'sector', label: 'Sector', align: 'left', hide: 'lg' },
    { key: 'price', label: 'Price (MK)', align: 'right' },
    { key: 'change_pct', label: 'Change %', align: 'right' },
    { key: 'volume', label: 'Volume', align: 'right', hide: 'sm' },
    { key: 'pe_ratio', label: 'P/E', align: 'right', hide: 'md' },
    { key: 'market_cap', label: 'Mkt Cap', align: 'right', hide: 'md' },
    { key: 'week52_high', label: '52-wk Range', align: 'right', hide: 'lg' },
]

const HIDE_CLASS: Record<string, string> = {
    sm: 'hidden sm:table-cell',
    md: 'hidden md:table-cell',
    lg: 'hidden lg:table-cell',
}

export function StocksTable({ stocks }: { stocks: StockRow[] }) {
    const [sortKey, setSortKey] = useState<SortKey>('symbol')
    const [sortDir, setSortDir] = useState<SortDir>('asc')
    const [search, setSearch] = useState('')

    function handleSort(key: SortKey) {
        if (key === sortKey) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir(key === 'symbol' || key === 'company_name' || key === 'sector' ? 'asc' : 'desc')
        }
    }

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return stocks
        return stocks.filter(s =>
            s.symbol.toLowerCase().includes(q) ||
            s.company_name.toLowerCase().includes(q) ||
            s.sector.toLowerCase().includes(q)
        )
    }, [stocks, search])

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const av = a[sortKey]
            const bv = b[sortKey]
            if (av === null && bv === null) return 0
            if (av === null) return 1   // nulls last
            if (bv === null) return -1
            const cmp = typeof av === 'string'
                ? av.localeCompare(bv as string)
                : (av as number) - (bv as number)
            return sortDir === 'asc' ? cmp : -cmp
        })
    }, [filtered, sortKey, sortDir])

    return (
        <div className="space-y-3">
            {/* Search */}
            <div className="relative">
                <input
                    type="search"
                    placeholder="Search by symbol, company or sector…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-3.5 py-2 text-[13px] text-(--color-text-primary) placeholder:text-(--color-text-tertiary) outline-none focus:border-(--color-border-primary) sm:max-w-sm"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
                <table className="w-full min-w-[420px] border-collapse text-left">
                    <thead>
                        <tr className="border-b-[0.5px] border-(--color-border-tertiary) bg-(--color-background-secondary)">
                            {COLUMNS.map(col => (
                                <th
                                    key={col.key}
                                    className={`px-3 py-2.5 text-[11px] font-semibold tracking-wide text-(--color-text-tertiary) uppercase cursor-pointer select-none whitespace-nowrap ${col.hide ? HIDE_CLASS[col.hide] : ''}`}
                                    style={{ textAlign: col.align }}
                                    onClick={() => handleSort(col.key)}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        {col.align === 'right' && (
                                            <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                                        )}
                                        {col.label}
                                        {col.align === 'left' && (
                                            <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 ? (
                            <tr>
                                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-[13px] text-(--color-text-tertiary)">
                                    No counters match &ldquo;{search}&rdquo;
                                </td>
                            </tr>
                        ) : (
                            sorted.map((s, i) => {
                                const isUp = (s.change_pct ?? 0) > 0
                                const isDown = (s.change_pct ?? 0) < 0
                                const changeColor = isUp
                                    ? 'var(--color-text-success)'
                                    : isDown
                                        ? 'var(--color-text-danger)'
                                        : 'var(--color-text-tertiary)'
                                const changeBg = isUp
                                    ? 'var(--color-background-success)'
                                    : isDown
                                        ? 'var(--color-background-danger)'
                                        : 'transparent'

                                return (
                                    <tr
                                        key={s.symbol}
                                        className={`group transition-colors hover:bg-(--color-background-secondary) ${i < sorted.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                                    >
                                        {/* Symbol */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <Link
                                                href={`/mse/${s.symbol.toLowerCase()}`}
                                                className="font-bold text-[13px] text-(--color-text-primary) no-underline hover:underline hover:decoration-(--color-text-warning)"
                                            >
                                                {s.symbol}
                                            </Link>
                                        </td>

                                        {/* Company */}
                                        <td className="hidden sm:table-cell px-3 py-3 text-[13px] text-(--color-text-secondary) max-w-[180px] truncate">
                                            {s.company_name}
                                        </td>

                                        {/* Sector */}
                                        <td className="hidden lg:table-cell px-3 py-3">
                                            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                                style={{ background: 'var(--color-background-warning)', color: 'var(--color-text-warning)' }}>
                                                {s.sector}
                                            </span>
                                        </td>

                                        {/* Price */}
                                        <td className="px-3 py-3 text-right whitespace-nowrap">
                                            <span className="text-[13px] font-semibold text-(--color-text-primary) font-(family-name:--font-mono)">
                                                {formatPrice(s.price)}
                                            </span>
                                        </td>

                                        {/* Change % */}
                                        <td className="px-3 py-3 text-right whitespace-nowrap">
                                            {s.change_pct != null ? (
                                                <span
                                                    className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-semibold font-(family-name:--font-mono)"
                                                    style={{ background: changeBg, color: changeColor }}
                                                >
                                                    {isUp && <ChevronUp size={10} aria-hidden="true" />}
                                                    {isDown && <ChevronDown size={10} aria-hidden="true" />}
                                                    {isUp ? '+' : ''}{s.change_pct.toFixed(2)}%
                                                </span>
                                            ) : (
                                                <span className="text-[12px] text-(--color-text-tertiary)">—</span>
                                            )}
                                        </td>

                                        {/* Volume */}
                                        <td className="hidden sm:table-cell px-3 py-3 text-right text-[13px] text-(--color-text-secondary) font-(family-name:--font-mono)">
                                            {formatVolume(s.volume)}
                                        </td>

                                        {/* P/E */}
                                        <td className="hidden md:table-cell px-3 py-3 text-right text-[13px] text-(--color-text-secondary) font-(family-name:--font-mono)">
                                            {s.pe_ratio != null ? s.pe_ratio.toFixed(1) : '—'}
                                        </td>

                                        {/* Market Cap */}
                                        <td className="hidden md:table-cell px-3 py-3 text-right text-[13px] text-(--color-text-secondary) font-(family-name:--font-mono)">
                                            {formatMarketCap(s.market_cap)}
                                        </td>

                                        {/* 52-week range */}
                                        <td className="hidden lg:table-cell px-3 py-3">
                                            <Week52Bar
                                                price={s.price}
                                                low={s.week52_low}
                                                high={s.week52_high}
                                            />
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer note */}
            <p className="text-[11px] text-(--color-text-tertiary)">
                Prices in Malawian Kwacha (MK). 52-week range computed from available price history.
                Click any symbol to view the full counter page.
            </p>
        </div>
    )
}