// app/(public)/markets/screeners/ScreenerTool.tsx
'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
    ChevronUp, ChevronDown, ChevronsUpDown, RotateCcw, X,
    Download, Columns3, Scale, Link2, Check,
} from 'lucide-react'

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
    dividend_yield: number | null // stubbed until the corporate-actions pipeline lands
}

type SortKey = keyof ScreenerStock | 'range52w'
type SortDir = 'asc' | 'desc'

type NumericFilterKey =
    | 'price' | 'change_pct' | 'pe_ratio' | 'market_cap_b'
    | 'from_high' | 'from_low'

type Bounds = Record<`${NumericFilterKey}Min` | `${NumericFilterKey}Max`, string>

const EMPTY_BOUNDS: Bounds = {
    priceMin: '', priceMax: '',
    change_pctMin: '', change_pctMax: '',
    pe_ratioMin: '', pe_ratioMax: '',
    market_cap_bMin: '', market_cap_bMax: '',
    from_highMin: '', from_highMax: '',
    from_lowMin: '', from_lowMax: '',
}

const DEFAULT_VISIBLE = {
    company_name: true,
    sector: true,
    pe_ratio: true,
    market_cap: true,
    dividend_yield: true,
    range52w: true,
}
type ToggleableColumn = keyof typeof DEFAULT_VISIBLE

// ---------- derived metrics ----------

function pctFromHigh(s: ScreenerStock): number | null {
    if (!s.week52_high) return null
    return ((s.price - s.week52_high) / s.week52_high) * 100
}

function pctFromLow(s: ScreenerStock): number | null {
    if (!s.week52_low) return null
    return ((s.price - s.week52_low) / s.week52_low) * 100
}

function rangePosition(s: ScreenerStock): number | null {
    if (s.week52_high == null || s.week52_low == null || s.week52_high === s.week52_low) return null
    const pct = ((s.price - s.week52_low) / (s.week52_high - s.week52_low)) * 100
    return Math.min(100, Math.max(0, pct))
}

// ---------- formatting ----------

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

function csvEscape(v: string | number | null) {
    if (v == null) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// ---------- presets ----------

type Preset = {
    id: string
    label: string
    disabled?: boolean
    apply: () => void
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
    toggleable?: ToggleableColumn
}

const COLUMNS: ColDef[] = [
    { key: 'symbol', label: 'Symbol', align: 'left' },
    { key: 'company_name', label: 'Company', align: 'left', hide: 'sm', toggleable: 'company_name' },
    { key: 'sector', label: 'Sector', align: 'left', hide: 'md', toggleable: 'sector' },
    { key: 'price', label: 'Price (MK)', align: 'right' },
    { key: 'change_pct', label: 'Change %', align: 'right' },
    { key: 'pe_ratio', label: 'P/E', align: 'right', hide: 'sm', toggleable: 'pe_ratio' },
    { key: 'market_cap', label: 'Mkt Cap', align: 'right', hide: 'md', toggleable: 'market_cap' },
    { key: 'dividend_yield', label: 'Div yield', align: 'right', hide: 'md', toggleable: 'dividend_yield' },
    { key: 'range52w', label: '52w range', align: 'left', hide: 'md', toggleable: 'range52w' },
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

function ToolbarButton({
    icon, label, onClick, active,
}: {
    icon: React.ReactNode
    label: string
    onClick: () => void
    active?: boolean
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1.5 rounded-(--border-radius-md) border-[0.5px] px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap cursor-pointer transition-colors"
            style={{
                borderColor: active ? 'var(--color-border-primary)' : 'var(--color-border-secondary)',
                background: active ? 'var(--color-background-secondary)' : 'var(--color-background-primary)',
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            }}
        >
            {icon}{label}
        </button>
    )
}

// Read/write the filter state to the URL without pulling in useSearchParams
// (which forces a Suspense boundary on this route). Plain history API is
// enough since this only ever runs client-side after mount.
function readParamsFromLocation(): URLSearchParams {
    if (typeof window === 'undefined') return new URLSearchParams()
    return new URLSearchParams(window.location.search)
}

export function ScreenerTool({ stocks }: { stocks: ScreenerStock[] }) {
    const sectors = useMemo(
        () => Array.from(new Set(stocks.map(s => s.sector))).sort(),
        [stocks],
    )

    const [selectedSectors, setSelectedSectors] = useState<string[]>([])
    const [sectorMenuOpen, setSectorMenuOpen] = useState(false)
    const [filtersOpen, setFiltersOpen] = useState(false) // collapsed by default on mobile; always expanded from sm: up
    const [bounds, setBounds] = useState<Bounds>(EMPTY_BOUNDS)
    const [sortKey, setSortKey] = useState<SortKey>('symbol')
    const [sortDir, setSortDir] = useState<SortDir>('asc')
    const [visibleCols, setVisibleCols] = useState<Record<ToggleableColumn, boolean>>(DEFAULT_VISIBLE)
    const [colMenuOpen, setColMenuOpen] = useState(false)
    const [compareMode, setCompareMode] = useState(false)
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
    const hydrated = useRef(false)
    const sectorMenuRef = useRef<HTMLDivElement>(null)
    const colMenuRef = useRef<HTMLDivElement>(null)

    // ---- hydrate filter state from the URL on first mount ----
    // Deliberately an effect, not a lazy useState initializer: this page is
    // server-rendered (ISR), so reading window.location during the initial
    // render would desync from the server HTML and trigger a hydration
    // mismatch. Running once after mount avoids that.
    /* eslint-disable react-hooks/set-state-in-effect -- one-time URL hydration on mount, see comment above */
    useEffect(() => {
        const params = readParamsFromLocation()
        const sec = params.get('sectors')
        if (sec) setSelectedSectors(sec.split(',').filter(Boolean))

        const nextBounds = { ...EMPTY_BOUNDS }
        for (const key of Object.keys(nextBounds) as (keyof Bounds)[]) {
            const v = params.get(key)
            if (v != null) nextBounds[key] = v
        }
        setBounds(nextBounds)

        const sk = params.get('sort')
        if (sk) setSortKey(sk as SortKey)
        const sd = params.get('dir')
        if (sd === 'asc' || sd === 'desc') setSortDir(sd)

        hydrated.current = true
    }, [])
    /* eslint-enable react-hooks/set-state-in-effect */

    // ---- keep the URL in sync so screens are shareable/bookmarkable ----
    useEffect(() => {
        if (!hydrated.current) return
        const params = new URLSearchParams()
        if (selectedSectors.length) params.set('sectors', selectedSectors.join(','))
        for (const [key, value] of Object.entries(bounds)) {
            if (value.trim() !== '') params.set(key, value)
        }
        if (sortKey !== 'symbol') params.set('sort', sortKey)
        if (sortDir !== 'asc') params.set('dir', sortDir)
        const qs = params.toString()
        const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
        window.history.replaceState(null, '', url)
    }, [selectedSectors, bounds, sortKey, sortDir])

    // ---- close the sector/column dropdowns on outside click or Escape ----
    useEffect(() => {
        if (!sectorMenuOpen && !colMenuOpen) return

        function handlePointerDown(e: PointerEvent) {
            const target = e.target as Node
            if (sectorMenuOpen && sectorMenuRef.current && !sectorMenuRef.current.contains(target)) {
                setSectorMenuOpen(false)
            }
            if (colMenuOpen && colMenuRef.current && !colMenuRef.current.contains(target)) {
                setColMenuOpen(false)
            }
        }
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setSectorMenuOpen(false)
                setColMenuOpen(false)
            }
        }

        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [sectorMenuOpen, colMenuOpen])

    function setBound(key: keyof Bounds, value: string) {
        setBounds(b => ({ ...b, [key]: value }))
    }

    function toggleSector(s: string) {
        setSelectedSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
    }

    function resetFilters() {
        setSelectedSectors([])
        setBounds(EMPTY_BOUNDS)
    }

    const activeFilterCount =
        selectedSectors.length + Object.values(bounds).filter(v => v.trim() !== '').length

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
        const fromHighMin = parseBound(bounds.from_highMin)
        const fromHighMax = parseBound(bounds.from_highMax)
        const fromLowMin = parseBound(bounds.from_lowMin)
        const fromLowMax = parseBound(bounds.from_lowMax)

        return stocks.filter(s => {
            if (selectedSectors.length && !selectedSectors.includes(s.sector)) return false
            if (priceMin != null && s.price < priceMin) return false
            if (priceMax != null && s.price > priceMax) return false
            if (changeMin != null && (s.change_pct ?? -Infinity) < changeMin) return false
            if (changeMax != null && (s.change_pct ?? Infinity) > changeMax) return false
            if (peMin != null && (s.pe_ratio ?? -Infinity) < peMin) return false
            if (peMax != null && (s.pe_ratio ?? Infinity) > peMax) return false
            if (capMinB != null && (s.market_cap ?? -Infinity) < capMinB * 1_000_000_000) return false
            if (capMaxB != null && (s.market_cap ?? Infinity) > capMaxB * 1_000_000_000) return false
            if (fromHighMin != null && (pctFromHigh(s) ?? -Infinity) < fromHighMin) return false
            if (fromHighMax != null && (pctFromHigh(s) ?? Infinity) > fromHighMax) return false
            if (fromLowMin != null && (pctFromLow(s) ?? -Infinity) < fromLowMin) return false
            if (fromLowMax != null && (pctFromLow(s) ?? Infinity) > fromLowMax) return false
            return true
        })
    }, [stocks, selectedSectors, bounds])

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const av = sortKey === 'range52w' ? rangePosition(a) : a[sortKey as keyof ScreenerStock]
            const bv = sortKey === 'range52w' ? rangePosition(b) : b[sortKey as keyof ScreenerStock]
            if (av === null && bv === null) return 0
            if (av === null) return 1
            if (bv === null) return -1
            const cmp = typeof av === 'string'
                ? av.localeCompare(bv as string)
                : (av as number) - (bv as number)
            return sortDir === 'asc' ? cmp : -cmp
        })
    }, [filtered, sortKey, sortDir])

    // ---- presets ----
    const presets: Preset[] = useMemo(() => [
        {
            id: 'gainers',
            label: 'Top gainers',
            apply: () => {
                resetFilters()
                setBound('change_pctMin', '0')
                setSortKey('change_pct'); setSortDir('desc')
            },
        },
        {
            id: 'losers',
            label: 'Top losers',
            apply: () => {
                resetFilters()
                setBound('change_pctMax', '0')
                setSortKey('change_pct'); setSortDir('asc')
            },
        },
        {
            id: 'near-high',
            label: 'Near 52w high',
            apply: () => {
                resetFilters()
                setBound('from_highMin', '-5'); setBound('from_highMax', '0')
                setSortKey('range52w'); setSortDir('desc')
            },
        },
        {
            id: 'near-low',
            label: 'Near 52w low',
            apply: () => {
                resetFilters()
                setBound('from_lowMin', '0'); setBound('from_lowMax', '5')
                setSortKey('range52w'); setSortDir('asc')
            },
        },
        {
            id: 'value',
            label: 'Value (low P/E)',
            apply: () => {
                resetFilters()
                setSortKey('pe_ratio'); setSortDir('asc')
            },
        },
        {
            id: 'large-cap',
            label: 'Large cap',
            apply: () => {
                resetFilters()
                setSortKey('market_cap'); setSortDir('desc')
            },
        },
        {
            id: 'dividend',
            label: 'High dividend',
            disabled: true,
            apply: () => { },
        },
    ], [])

    // ---- CSV export ----
    function exportCsv() {
        const headers = ['Symbol', 'Company', 'Sector', 'Price (MK)', 'Change %', 'P/E', 'Market cap (MK)', '52w low', '52w high', 'Dividend yield %']
        const rows = sorted.map(s => [
            s.symbol, s.company_name, s.sector, s.price, s.change_pct, s.pe_ratio,
            s.market_cap, s.week52_low, s.week52_high, s.dividend_yield,
        ])
        const csv = [headers, ...rows].map(r => r.map(csvEscape).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mse-screener-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    function copyLink() {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopyState('copied')
            setTimeout(() => setCopyState('idle'), 1500)
        })
    }

    function toggleSelected(symbol: string) {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(symbol)) next.delete(symbol)
            else next.add(symbol)
            return next
        })
    }

    const compareStocks = stocks.filter(s => selected.has(s.symbol))

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                <ToolbarButton
                    icon={<Scale size={13} />}
                    label={compareMode ? 'Exit compare' : 'Compare'}
                    active={compareMode}
                    onClick={() => setCompareMode(v => !v)}
                />
                <ToolbarButton icon={<Download size={13} />} label="Export CSV" onClick={exportCsv} />
                <ToolbarButton
                    icon={copyState === 'copied' ? <Check size={13} /> : <Link2 size={13} />}
                    label={copyState === 'copied' ? 'Link copied' : 'Copy link'}
                    onClick={copyLink}
                />
                <div className="relative ml-auto" ref={colMenuRef}>
                    <ToolbarButton
                        icon={<Columns3 size={13} />}
                        label="Columns"
                        active={colMenuOpen}
                        onClick={() => setColMenuOpen(v => !v)}
                    />
                    {colMenuOpen && (
                        <div className="absolute right-0 z-10 mt-1.5 w-44 rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) p-2 shadow-(--shadow-card)">
                            {COLUMNS.filter(c => c.toggleable).map(c => (
                                <label key={c.toggleable} className="flex items-center gap-2 px-1.5 py-1 text-[12px] text-(--color-text-secondary) cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={visibleCols[c.toggleable!]}
                                        onChange={() => setVisibleCols(v => ({ ...v, [c.toggleable!]: !v[c.toggleable!] }))}
                                    />
                                    {c.label}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-(--color-text-tertiary) mr-0.5">Presets:</span>
                {presets.map(p => (
                    <button
                        key={p.id}
                        type="button"
                        disabled={p.disabled}
                        onClick={p.apply}
                        title={p.disabled ? 'Coming soon — needs the dividend data pipeline' : undefined}
                        className="rounded-full px-2.5 py-1 text-[11px] font-medium border-[0.5px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                            borderColor: 'var(--color-border-secondary)',
                            background: 'var(--color-background-primary)',
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Filter panel */}
            <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-3.5 shadow-(--shadow-card)">
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setFiltersOpen(v => !v)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFiltersOpen(v => !v) } }}
                    aria-expanded={filtersOpen}
                    className="flex w-full items-center justify-between gap-2 cursor-pointer sm:cursor-default"
                >
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-(--color-text-tertiary)">
                        <ChevronDown
                            size={13}
                            className={`transition-transform sm:hidden ${filtersOpen ? 'rotate-180' : ''}`}
                        />
                        Filters {activeFilterCount > 0 && `(${activeFilterCount} active)`}
                    </span>
                    {activeFilterCount > 0 && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); resetFilters() }}
                            className="inline-flex items-center gap-1 cursor-pointer border-none bg-transparent p-0 text-[11px] font-medium text-(--color-text-tertiary) hover:text-(--color-text-primary)"
                        >
                            <RotateCcw size={11} /> Reset
                        </button>
                    )}
                </div>

                <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block`}>
                    {/* Sector multi-select */}
                    <div className="mt-3">
                        <label className="mb-1 block text-[11px] font-medium text-(--color-text-tertiary)">Sector</label>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {selectedSectors.map(s => (
                                <span
                                    key={s}
                                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                                    style={{ background: 'var(--color-background-info)', color: 'var(--color-text-info)' }}
                                >
                                    {s}
                                    <button type="button" onClick={() => toggleSector(s)} aria-label={`Remove ${s}`} className="cursor-pointer border-none bg-transparent p-0 leading-none">
                                        <X size={11} />
                                    </button>
                                </span>
                            ))}
                            <div className="relative" ref={sectorMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setSectorMenuOpen(v => !v)}
                                    className="rounded-full px-2.5 py-1 text-[11px] font-medium border-[0.5px] cursor-pointer"
                                    style={{ borderColor: 'var(--color-border-secondary)', color: 'var(--color-text-tertiary)' }}
                                >
                                    + Add sector
                                </button>
                                {sectorMenuOpen && (
                                    <div className="absolute left-0 z-10 mt-1.5 max-h-56 w-48 overflow-y-auto rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) p-1.5 shadow-(--shadow-card)">
                                        {sectors.map(s => (
                                            <label key={s} className="flex items-center gap-2 px-1.5 py-1 text-[12px] text-(--color-text-secondary) cursor-pointer">
                                                <input type="checkbox" checked={selectedSectors.includes(s)} onChange={() => toggleSector(s)} />
                                                {s}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

                        {/* % from 52w high */}
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-(--color-text-tertiary)">% from 52w high</label>
                            <div className="flex gap-1.5">
                                <NumberField label="Min % from high" placeholder="Min" value={bounds.from_highMin} onChange={v => setBound('from_highMin', v)} />
                                <NumberField label="Max % from high" placeholder="Max" value={bounds.from_highMax} onChange={v => setBound('from_highMax', v)} />
                            </div>
                        </div>

                        {/* % from 52w low */}
                        <div>
                            <label className="mb-1 block text-[11px] font-medium text-(--color-text-tertiary)">% from 52w low</label>
                            <div className="flex gap-1.5">
                                <NumberField label="Min % from low" placeholder="Min" value={bounds.from_lowMin} onChange={v => setBound('from_lowMin', v)} />
                                <NumberField label="Max % from low" placeholder="Max" value={bounds.from_lowMax} onChange={v => setBound('from_lowMax', v)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Result count */}
            <div className="flex items-center justify-between">
                <p className="text-[12px] text-(--color-text-tertiary)">
                    {sorted.length} of {stocks.length} counters match
                </p>
                {compareMode && (
                    <p className="text-[12px] text-(--color-text-tertiary)">
                        {selected.size} selected
                    </p>
                )}
            </div>

            {/* Compare panel */}
            {compareMode && compareStocks.length >= 2 && (
                <div className="overflow-x-auto rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
                    <table className="w-full min-w-[420px] border-collapse text-left">
                        <thead>
                            <tr className="border-b-[0.5px] border-(--color-border-tertiary) bg-(--color-background-secondary)">
                                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-(--color-text-tertiary)">Metric</th>
                                {compareStocks.map(s => (
                                    <th key={s.symbol} className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-(--color-text-tertiary) text-right">{s.symbol}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { label: 'Price (MK)', get: (s: ScreenerStock) => formatPrice(s.price) },
                                { label: 'Change %', get: (s: ScreenerStock) => s.change_pct != null ? `${s.change_pct > 0 ? '+' : ''}${s.change_pct.toFixed(2)}%` : '—' },
                                { label: 'P/E', get: (s: ScreenerStock) => s.pe_ratio != null ? s.pe_ratio.toFixed(1) : '—' },
                                { label: 'Market cap', get: (s: ScreenerStock) => formatMarketCap(s.market_cap) },
                                { label: 'Dividend yield', get: (s: ScreenerStock) => s.dividend_yield != null ? `${s.dividend_yield.toFixed(1)}%` : '—' },
                                { label: '52w low – high', get: (s: ScreenerStock) => s.week52_low != null && s.week52_high != null ? `${formatPrice(s.week52_low)} – ${formatPrice(s.week52_high)}` : '—' },
                            ].map(row => (
                                <tr key={row.label} className="border-b-[0.5px] border-(--color-border-tertiary) last:border-b-0">
                                    <td className="px-3 py-2.5 text-[12px] text-(--color-text-tertiary)">{row.label}</td>
                                    {compareStocks.map(s => (
                                        <td key={s.symbol} className="px-3 py-2.5 text-right text-[13px] font-(family-name:--font-mono) text-(--color-text-primary)">
                                            {row.get(s)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
                <table className="w-full min-w-[420px] border-collapse text-left">
                    <thead>
                        <tr className="border-b-[0.5px] border-(--color-border-tertiary) bg-(--color-background-secondary)">
                            {compareMode && <th className="w-8 px-3 py-2.5" />}
                            {COLUMNS.filter(c => !c.toggleable || visibleCols[c.toggleable]).map(col => (
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
                                <td colSpan={COLUMNS.length + (compareMode ? 1 : 0)} className="px-4 py-10 text-center text-[13px] text-(--color-text-tertiary)">
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
                                const rangePos = rangePosition(s)

                                return (
                                    <tr
                                        key={s.symbol}
                                        className={`group transition-colors hover:bg-(--color-background-secondary) ${i < sorted.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                                    >
                                        {compareMode && (
                                            <td className="px-3 py-3">
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Select ${s.symbol} for comparison`}
                                                    checked={selected.has(s.symbol)}
                                                    onChange={() => toggleSelected(s.symbol)}
                                                    disabled={!selected.has(s.symbol) && selected.size >= 4}
                                                />
                                            </td>
                                        )}

                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <Link
                                                href={`/stocks/${s.symbol.toLowerCase()}`}
                                                className="font-bold text-[13px] text-(--color-text-primary) no-underline hover:underline hover:decoration-(--color-text-warning)"
                                            >
                                                {s.symbol}
                                            </Link>
                                        </td>

                                        {visibleCols.company_name && (
                                            <td className="hidden sm:table-cell px-3 py-3 text-[13px] text-(--color-text-secondary) max-w-[180px] truncate">
                                                {s.company_name}
                                            </td>
                                        )}

                                        {visibleCols.sector && (
                                            <td className="hidden md:table-cell px-3 py-3">
                                                <span className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                                    style={{ background: 'var(--color-background-warning)', color: 'var(--color-text-warning)' }}>
                                                    {s.sector}
                                                </span>
                                            </td>
                                        )}

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

                                        {visibleCols.pe_ratio && (
                                            <td className="hidden sm:table-cell px-3 py-3 text-right text-[13px] text-(--color-text-secondary) font-(family-name:--font-mono)">
                                                {s.pe_ratio != null ? s.pe_ratio.toFixed(1) : '—'}
                                            </td>
                                        )}

                                        {visibleCols.market_cap && (
                                            <td className="hidden md:table-cell px-3 py-3 text-right text-[13px] text-(--color-text-secondary) font-(family-name:--font-mono)">
                                                {formatMarketCap(s.market_cap)}
                                            </td>
                                        )}

                                        {visibleCols.dividend_yield && (
                                            <td className="hidden md:table-cell px-3 py-3 text-right text-[13px] text-(--color-text-secondary) font-(family-name:--font-mono)">
                                                {s.dividend_yield != null ? `${s.dividend_yield.toFixed(1)}%` : '—'}
                                            </td>
                                        )}

                                        {visibleCols.range52w && (
                                            <td className="hidden md:table-cell px-3 py-3">
                                                {rangePos != null ? (
                                                    <div className="relative h-[5px] w-20 rounded-full" style={{ background: 'var(--color-background-secondary)' }}>
                                                        <div
                                                            className="absolute top-1/2 h-2 w-2 -translate-y-1/2 -translate-x-1/2 rounded-full"
                                                            style={{
                                                                left: `${rangePos}%`,
                                                                background: rangePos >= 80
                                                                    ? 'var(--color-text-success)'
                                                                    : rangePos <= 20
                                                                        ? 'var(--color-text-danger)'
                                                                        : 'var(--color-text-warning)',
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-[12px] text-(--color-text-tertiary)">—</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <p className="text-[11px] text-(--color-text-tertiary)">
                Prices in Malawian Kwacha (MK). Market cap filter is entered in billions of MK for convenience.
                52w range shows where the price sits between its 52-week low and high; dividend yield will populate once the corporate-actions pipeline is live.
            </p>
        </div>
    )
}