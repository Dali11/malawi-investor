// app/(public)/markets/screeners/ScreenerTool.tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronUp, ChevronDown, ChevronsUpDown, RotateCcw } from 'lucide-react'

export type ScreenerStock = {
    symbol: string
    company_name: string
    sector: string
    price: number
    change_pct: number | null
    pe_ratio: number | null
    market_cap: number | null
    week52_high: number | null
    week52_low: number | null
}

type SortKey = keyof ScreenerStock
type SortDir = 'asc' | 'desc'

type NumericFilterKey = 'price' | 'change_pct' | 'pe_ratio' | 'market_cap_b'

type Bounds = Record<`${NumericFilterKey}Min` | `${NumericFilterKey}Max`, string>

const EMPTY_BOUNDS: Bounds = {
    priceMin: '', priceMax: '',
    change_pctMin: '', change_pctMax: '',
    pe_ratioMin: '', pe_ratioMax: '',
    market_cap_bMin: '', market_cap_bMax: '',
}

function formatPrice(n: number) {
    return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatMarketCap(n: number | null) {
    if (!n) return '—'
    if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T`
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`
    return n.toLocaleString('en')
}

function parseBound(v: string): number | null {
    if (v.trim() === '') return null
    const n = Number(v)
    return Number.isNaN(n) ? null : n
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
    hide?: 'sm' | 'md'
}

const COLUMNS: ColDef[] = [
    { key: 'symbol', label: 'Symbol', align: 'left' },
    { key: 'company_name', label: 'Company', align: 'left', hide: 'sm' },
    { key: 'sector', label: 'Sector', align: 'left', hide: 'md' },
    { key: 'price', label: 'Price (MK)', align: 'right' },
    { key: 'change_pct', label: 'Change %', align: 'right' },
    { key: 'pe_ratio', label: 'P/E', align: 'right', hide: 'sm' },
    { key: 'market_cap', label: 'Mkt Cap', align: 'right', hide: 'md' },
]

const HIDE_CLASS: Record<string, string> = {
    sm: 'hidden sm:table-cell',
    md: 'hidden md:table-cell',
}

function NumberField({
    label, placeholder, value, onChange,
}: {
    label: string
    placeholder: string
    value: string
    onChange: (v: string) => void
}) {
    return (
        <input
            type="number"
            inputMode="decimal"
            aria-label={label}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-2.5 py-1.5 text-[12px] text-(--color-text-primary) placeholder:text-(--color-text-tertiary) outline-none focus:border-(--color-border-primary)"
        />
    )
}

export function ScreenerTool({ stocks }: { stocks: ScreenerStock[] }) {
    const sectors = useMemo(
        () => Array.from(new Set(stocks.map(s => s.sector))).sort(),
        [stocks],
    )

    const [sector, setSector] = useState('All')
    const [bounds, setBounds] = useState<Bounds>(EMPTY_BOUNDS)
    const [sortKey, setSortKey] = useState<SortKey>('symbol')
    const [sortDir, setSortDir] = useState<SortDir>('asc')

    function setBound(key: keyof Bounds, value: string) {
        setBounds(b => ({ ...b, [key]: value }))
    }

    function resetFilters() {
        setSector('All')
        setBounds(EMPTY_BOUNDS)
    }

    const activeFilterCount =
        (sector !== 'All' ? 1 : 0) + Object.values(bounds).filter(v => v.trim() !== '').length

    function handleSort(key: SortKey) {
        if (key === sortKey) {
            setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortKey(key)
            setSortDir(key === 'symbol' || key === 'company_name' || key === 'sector' ? 'asc' : 'desc')
        }
    }

    const filtered = useMemo(() => {
        const priceMin = parseBound(bounds.priceMin)
        const priceMax = parseBound(bounds.priceMax)
        const changeMin = parseBound(bounds.change_pctMin)
        const changeMax = parseBound(bounds.change_pctMax)
        const peMin = parseBound(bounds.pe_ratioMin)
        const peMax = parseBound(bounds.pe_ratioMax)
        const capMinB = parseBound(bounds.market_cap_bMin)
        const capMaxB = parseBound(bounds.market_cap_bMax)

        return stocks.filter(s => {
            if (sector !== 'All' && s.sector !== sector) return false
            if (priceMin != null && s.price < priceMin) return false
            if (priceMax != null && s.price > priceMax) return false
            if (changeMin != null && (s.change_pct ?? -Infinity) < changeMin) return false
            if (changeMax != null && (s.change_pct ?? Infinity) > changeMax) return false
            if (peMin != null && (s.pe_ratio ?? -Infinity) < peMin) return false
            if (peMax != null && (s.pe_ratio ?? Infinity) > peMax) return false
            if (capMinB != null && (s.market_cap ?? -Infinity) < capMinB * 1_000_000_000) return false
            if (capMaxB != null && (s.market_cap ?? Infinity) > capMaxB * 1_000_000_000) return false
            return true
        })
    }, [stocks, sector, bounds])

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const av = a[sortKey]
            const bv = b[sortKey]
            if (av === null && bv === null) return 0
            if (av === null) return 1
            if (bv === null) return -1
            const cmp = typeof av === 'string'
                ? av.localeCompare(bv as string)
                : (av as number) - (bv as number)
            return sortDir === 'asc' ? cmp : -cmp
        })
    }, [filtered, sortKey, sortDir])

    return (
        <div className="space-y-3">
            {/* Filter panel */}
            <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-3.5 shadow-(--shadow-card)">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-(--color-text-tertiary)">
                        Filters {activeFilterCount > 0 && `(${activeFilterCount} active)`}
                    </p>
                    {activeFilterCount > 0 && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1 cursor-pointer border-none bg-transparent text-[11px] font-medium text-(--color-text-tertiary) hover:text-(--color-text-primary)"
                        >
                            <RotateCcw size={11} /> Reset
                        </button>
                    )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {/* Sector */}
                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-(--color-text-tertiary)">Sector</label>
                        <select
                            value={sector}
                            onChange={e => setSector(e.target.value)}
                            className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-2.5 py-1.5 text-[12px] text-(--color-text-primary) outline-none focus:border-(--color-border-primary)"
                        >
                            <option value="All">All sectors</option>
                            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-(--color-text-tertiary)">Price (MK)</label>
                        <div className="flex gap-1.5">
                            <NumberField label="Min price" placeholder="Min" value={bounds.priceMin} onChange={v => setBound('priceMin', v)} />
                            <NumberField label="Max price" placeholder="Max" value={bounds.priceMax} onChange={v => setBound('priceMax', v)} />
                        </div>
                    </div>

                    {/* Change % */}
                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-(--color-text-tertiary)">Change %</label>
                        <div className="flex gap-1.5">
                            <NumberField label="Min change" placeholder="Min" value={bounds.change_pctMin} onChange={v => setBound('change_pctMin', v)} />
                            <NumberField label="Max change" placeholder="Max" value={bounds.change_pctMax} onChange={v => setBound('change_pctMax', v)} />
                        </div>
                    </div>

                    {/* P/E */}
                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-(--color-text-tertiary)">P/E ratio</label>
                        <div className="flex gap-1.5">
                            <NumberField label="Min P/E" placeholder="Min" value={bounds.pe_ratioMin} onChange={v => setBound('pe_ratioMin', v)} />
                            <NumberField label="Max P/E" placeholder="Max" value={bounds.pe_ratioMax} onChange={v => setBound('pe_ratioMax', v)} />
                        </div>
                    </div>

                    {/* Market cap */}
                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-(--color-text-tertiary)">Mkt cap (MK bn)</label>
                        <div className="flex gap-1.5">
                            <NumberField label="Min market cap" placeholder="Min" value={bounds.market_cap_bMin} onChange={v => setBound('market_cap_bMin', v)} />
                            <NumberField label="Max market cap" placeholder="Max" value={bounds.market_cap_bMax} onChange={v => setBound('market_cap_bMax', v)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Result count */}
            <p className="text-[12px] text-(--color-text-tertiary)">
                {sorted.length} of {stocks.length} counters match
            </p>

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
                                        {col.align === 'right' && <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />}
                                        {col.label}
                                        {col.align === 'left' && <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 ? (
                            <tr>
                                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-[13px] text-(--color-text-tertiary)">
                                    No counters match your filters.
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
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <Link
                                                href={`/mse/${s.symbol.toLowerCase()}`}
                                                className="font-bold text-[13px] text-(--color-text-primary) no-underline hover:underline hover:decoration-(--color-text-warning)"
                                            >
                                                {s.symbol}
                                            </Link>
                                        </td>

                                        <td className="hidden sm:table-cell px-3 py-3 text-[13px] text-(--color-text-secondary) max-w-[180px] truncate">
                                            {s.company_name}
                                        </td>

                                        <td className="hidden md:table-cell px-3 py-3">
                                            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                                style={{ background: 'var(--color-background-warning)', color: 'var(--color-text-warning)' }}>
                                                {s.sector}
                                            </span>
                                        </td>

                                        <td className="px-3 py-3 text-right whitespace-nowrap">
                                            <span className="text-[13px] font-semibold text-(--color-text-primary) font-(family-name:--font-mono)">
                                                {formatPrice(s.price)}
                                            </span>
                                        </td>

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

                                        <td className="hidden sm:table-cell px-3 py-3 text-right text-[13px] text-(--color-text-secondary) font-(family-name:--font-mono)">
                                            {s.pe_ratio != null ? s.pe_ratio.toFixed(1) : '—'}
                                        </td>

                                        <td className="hidden md:table-cell px-3 py-3 text-right text-[13px] text-(--color-text-secondary) font-(family-name:--font-mono)">
                                            {formatMarketCap(s.market_cap)}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <p className="text-[11px] text-(--color-text-tertiary)">
                Prices in Malawian Kwacha (MK). Market cap filter is entered in billions of MK for convenience.
            </p>
        </div>
    )
}
