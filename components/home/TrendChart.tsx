'use client'

import { useState, useEffect, useId } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { RangeKey } from '@/lib/chart-data'

const RANGES: RangeKey[] = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', '10Y', 'MAX']

type ChartPoint = { date: string; value: number }

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

export function TrendChart({ symbol }: { symbol?: string | null }) {
    const [range, setRange] = useState<RangeKey>('1M')
    const [points, setPoints] = useState<ChartPoint[]>([])
    const [isComposite, setIsComposite] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const gradientId = useId()

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(false)

        const params = new URLSearchParams({ range })
        if (symbol) params.set('symbol', symbol)

        fetch(`/api/chart-data?${params.toString()}`)
            .then((res) => {
                if (!res.ok) throw new Error('Request failed')
                return res.json()
            })
            .then((data) => {
                if (cancelled) return
                setPoints(data.points ?? [])
                setIsComposite(Boolean(data.isComposite))
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
    }, [symbol, range])

    const isUp = points.length >= 2 && points[points.length - 1].value >= points[0].value
    const lineColor = isUp ? 'var(--color-text-success)' : 'var(--color-text-danger)'

    // Compute a sensible y-axis domain rather than letting Recharts
    // auto-stretch tiny fluctuations to fill the chart height. For the
    // composite (a % change series that's often very close to 0), the
    // domain always includes 0 and a generous minimum total span, so
    // small day-to-day moves (common on this market) don't visually
    // read as dramatic swings just because the axis stretched to fit.
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

        const span = max - min
        const pad = Math.max(span * 0.06, max * 0.005)
        return [min - pad, max + pad]
    }

    const yDomain = getYDomain()
    const yTickFormatter = (value: number) =>
        isComposite ? `${value.toFixed(1)}%` : value.toLocaleString('en', { maximumFractionDigits: 0 })

    const sparse = (range === '1D' || range === '5D') && points.length < 2

    return (
        <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-secondary) p-3">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-medium tracking-wider text-(--color-text-tertiary) uppercase">
                    {isComposite ? 'Market composite' : `${symbol} trend`}
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
                ) : sparse ? (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-xs text-(--color-text-tertiary)">
                        <span>Only end-of-day prices are tracked — not enough points to chart {range}.</span>
                        <span>Try 1M or a longer range.</span>
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
                                formatter={(value: number) =>
                                    isComposite ? `${value.toFixed(2)}%` : value.toLocaleString('en', { minimumFractionDigits: 2 })
                                }
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                contentStyle={{
                                    background: 'var(--color-background-primary)',
                                    border: '0.5px solid var(--color-border-tertiary)',
                                    borderRadius: 'var(--border-radius-md)',
                                    fontSize: 12,
                                }}
                            />
                            <Area
                                type="linear"
                                dataKey="value"
                                stroke={lineColor}
                                strokeWidth={1.75}
                                fill={`url(#${gradientId})`}
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {isComposite && (
                <p className="mt-2 text-[10px] text-(--color-text-tertiary)">
                    Equal-weighted average across tracked counters — not the official MASI.
                </p>
            )}
        </div>
    )
}