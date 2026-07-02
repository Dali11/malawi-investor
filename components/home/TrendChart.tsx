'use client'

import { useState, useEffect, useId } from 'react'
import { AreaChart, Area, Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { RangeKey } from '@/lib/chart-data'

const RANGES: RangeKey[] = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', '10Y', 'MAX']

type ChartPoint = { date: string; value: number; volume?: number | null }

function formatVolumeTick(v: number) {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
    return `${v}`
}

function formatTick(dateStr: string, range: RangeKey) {
    const d = new Date(dateStr)
    if (range === '1D' || range === '5D') {
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }
    if (range === '5Y' || range === '10Y' || range === 'MAX') {
        return d.toLocaleDateString(undefined, { year: 'numeric' })
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function TrendChart({ symbol, indexCode, label, defaultRange, showVolume }: { symbol?: string | null; indexCode?: string | null; label?: string; defaultRange?: RangeKey; showVolume?: boolean }) {
    const [range, setRange] = useState<RangeKey>(defaultRange ?? '5D')
    const [points, setPoints] = useState<ChartPoint[]>([])
    const [isComposite, setIsComposite] = useState(false)
    const [isSynthetic, setIsSynthetic] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const gradientId = useId()

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(false)

        const params = new URLSearchParams({ range })
        if (indexCode) {
            params.set('index', indexCode)
        } else if (symbol) {
            params.set('symbol', symbol)
        }

        fetch(`/api/chart-data?${params.toString()}`)
            .then((res) => {
                if (!res.ok) throw new Error('Request failed')
                return res.json()
            })
            .then((data) => {
                if (cancelled) return
                setPoints(data.points ?? [])
                setIsComposite(Boolean(data.isComposite))
                setIsSynthetic(Boolean(data.isSynthetic))
            })
            .catch(() => {
                if (!cancelled) setError(true)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [symbol, indexCode, range])

    const isUp = points.length >= 2 && points[points.length - 1].value >= points[0].value
    const lineColor = isUp ? 'var(--color-text-success)' : 'var(--color-text-danger)'

    // If consecutive points are weeks/months apart (e.g. backfilled
    // index snapshots recovered from sparse Wayback Machine crawls),
    // a solid interpolated line falsely implies continuous daily
    // data. Detect large gaps and switch to a dashed line with
    // visible dot markers plus an explicit disclaimer instead.
    function maxGapDays(pts: ChartPoint[]): number {
        if (pts.length < 2) return 0
        let max = 0
        for (let i = 1; i < pts.length; i++) {
            const diff = (new Date(pts[i].date).getTime() - new Date(pts[i - 1].date).getTime()) / 86_400_000
            if (diff > max) max = diff
        }
        return max
    }
    const isSparseSeries = points.length >= 2 && maxGapDays(points) > 45

    // Compute a sensible y-axis domain. Composite (equal-weighted %)
    // and synthetic (MDSI/MFSI rebased-to-100) series both get a
    // minimum span so small day-to-day moves don't visually inflate.
    function getYDomain(): [number, number] {
        if (points.length === 0) return [0, 1]
        const values = points.map((p) => p.value)
        const min = Math.min(...values)
        const max = Math.max(...values)

        if (isComposite) {
            const lo = Math.min(0, min)
            const hi = Math.max(0, max)
            const span = hi - lo
            const minSpan = 4
            const effectiveSpan = Math.max(span, minSpan)
            const pad = effectiveSpan * 0.08
            const mid = (hi + lo) / 2
            return [mid - effectiveSpan / 2 - pad, mid + effectiveSpan / 2 + pad]
        }

        if (isSynthetic) {
            const span = Math.max(max - min, 2) // minimum 2-point span
            const pad = span * 0.1
            return [min - pad, max + pad]
        }

        const span = max - min
        const pad = Math.max(span * 0.06, max * 0.005)
        return [min - pad, max + pad]
    }

    const yDomain = getYDomain()
    const yTickFormatter = (value: number) => {
        if (isComposite) return `${value.toFixed(1)}%`
        if (isSynthetic) return value.toFixed(1)
        return value.toLocaleString('en', { maximumFractionDigits: 0 })
    }

    const tooFewPoints = points.length < 2

    return (
        <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-secondary) p-3">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-medium tracking-wider text-(--color-text-tertiary) uppercase">
                    {label ?? (isComposite ? 'Market composite' : `${symbol} trend`)}
                </p>
                <div className="flex gap-0.5 overflow-x-auto">
                    {RANGES.map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`shrink-0 rounded-(--border-radius-md) px-1.5 py-0.5 text-[10px] font-medium transition-colors ${range === r
                                    ? 'bg-(--color-text-primary) text-(--color-background-primary)'
                                    : 'text-(--color-text-tertiary) hover:bg-(--color-background-primary) hover:text-(--color-text-secondary)'
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[140px]">
                {loading ? (
                    <div className="flex h-full items-center justify-center text-xs text-(--color-text-tertiary)">
                        Loading chart…
                    </div>
                ) : error ? (
                    <div className="flex h-full items-center justify-center text-xs text-(--color-text-tertiary)">
                        Couldn't load chart data. Try a different range.
                    </div>
                ) : points.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-(--color-text-tertiary)">
                        No history available for this range yet.
                    </div>
                ) : tooFewPoints ? (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-xs text-(--color-text-tertiary)">
                        <span>
                            {(range === '1D' || range === '5D')
                                ? `Only end-of-day prices are tracked — not enough points to chart ${range}.`
                                : 'Only 1 data point falls in this range — not enough to draw a trend.'}
                        </span>
                        <span>Try a different range.</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                                    <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="var(--color-border-tertiary)" strokeDasharray="0" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(d) => formatTick(d, range)}
                                tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
                                axisLine={false}
                                tickLine={false}
                                minTickGap={80}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                domain={yDomain}
                                tickFormatter={yTickFormatter}
                                orientation="right"
                                width={52}
                                tickCount={4}
                                tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                formatter={(value) => {
                                    if (typeof value !== 'number') return '—'
                                    if (isComposite) return `${value.toFixed(2)}%`
                                    if (isSynthetic) return value.toFixed(2)
                                    return value.toLocaleString('en', { minimumFractionDigits: 2 })
                                }}
                            />
                            <Area
                                type="linear"
                                dataKey="value"
                                stroke={lineColor}
                                strokeWidth={1.75}
                                strokeDasharray={isSparseSeries ? '5 4' : undefined}
                                fill={isSparseSeries ? 'none' : `url(#${gradientId})`}
                                dot={isSparseSeries ? { r: 3, fill: lineColor, strokeWidth: 0 } : false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {showVolume && !isComposite && !isSynthetic && !loading && !error && points.some((p) => p.volume != null) && (
                <div className="mt-1 h-[44px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={points} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                            <XAxis dataKey="date" hide />
                            <YAxis
                                dataKey="volume"
                                orientation="right"
                                width={52}
                                tickCount={2}
                                tickFormatter={formatVolumeTick}
                                tick={{ fontSize: 9, fill: 'var(--color-text-tertiary)' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                formatter={(value) => [typeof value === 'number' ? value.toLocaleString('en') : '—', 'Volume']}
                                labelFormatter={(d) => formatTick(String(d), range)}
                            />
                            <Bar dataKey="volume" fill="var(--color-text-tertiary)" opacity={0.5} radius={[1, 1, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {isComposite && (
                <p className="mt-2 text-[10px] text-(--color-text-tertiary)">
                    Equal-weighted average across tracked counters — not the official MASI.
                </p>
            )}
            {isSynthetic && !isSparseSeries && (
                <p className="mt-2 text-[10px] text-(--color-text-tertiary)">
                    Synthetic index rebased to 100 — built by chaining daily % changes since daily tracking began.
                </p>
            )}
            {isSparseSeries && (
                <p className="mt-2 text-[10px] text-(--color-text-tertiary)">
                    Dashed line connects {points.length} known data points, weeks or months apart — not daily data.
                </p>
            )}
        </div>
    )
}