// components/home/MostActiveCounters.tsx
// Shows the top counters by volume for the latest trading day.
// Volume is not yet in mse_prices — uses market_cap as a proxy
// until a volume column is added. Clearly labelled in the UI.

import Link from 'next/link'
import { Activity } from 'lucide-react'

export type ActiveCounter = {
    symbol: string
    company_name: string
    price: number
    change_pct: number | null
    volume?: number | null
    market_cap?: number | null
}

function formatMarketCap(n: number | null | undefined): string {
    if (!n) return '—'
    if (n >= 1_000_000_000) return `MK ${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `MK ${(n / 1_000_000).toFixed(0)}M`
    return `MK ${n.toLocaleString('en')}`
}

export function MostActiveCounters({ counters }: { counters: ActiveCounter[] }) {
    return (
        <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
            {/* Header */}
            <div className="flex items-center gap-2 border-b-[0.5px] border-(--color-border-tertiary) px-4 py-2.5">
                <Activity size={13} className="text-(--color-text-tertiary)" aria-hidden="true" />
                <p className="text-[11px] font-bold tracking-wider text-(--color-text-tertiary) uppercase">
                    Most active counters
                </p>
            </div>

            {/* Column headings */}
            <div className="grid grid-cols-[1fr_80px_70px_80px] gap-2 border-b-[0.5px] border-(--color-border-tertiary) px-4 py-1.5">
                {['Counter', 'Price', 'Change', 'Mkt Cap'].map((h, i) => (
                    <span
                        key={h}
                        className="text-[11px] font-medium text-(--color-text-tertiary)"
                        style={{ textAlign: i > 0 ? 'right' : 'left' }}
                    >
                        {h}
                    </span>
                ))}
            </div>

            {counters.length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px] text-(--color-text-tertiary)">No data available</p>
            ) : (
                counters.map((c, i) => {
                    const pct = Number(c.change_pct)
                    const isUp = pct > 0
                    const isDown = pct < 0
                    const textColor = isUp
                        ? 'var(--color-text-success)'
                        : isDown
                            ? 'var(--color-text-danger)'
                            : 'var(--color-text-tertiary)'

                    return (
                        <Link
                            key={c.symbol}
                            href={`/mse/${c.symbol.toLowerCase()}`}
                            className={`grid grid-cols-[1fr_80px_70px_80px] gap-2 items-center px-4 py-2.5 no-underline transition-colors hover:bg-(--color-background-secondary) ${i < counters.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                        >
                            <div>
                                <p className="text-[13px] font-semibold text-(--color-text-primary)">{c.symbol}</p>
                                <p className="text-[11px] text-(--color-text-tertiary) truncate">{c.company_name}</p>
                            </div>
                            <span className="text-right text-[13px] font-medium text-(--color-text-primary) font-(family-name:--font-mono)">
                                {Number(c.price).toLocaleString('en', { minimumFractionDigits: 2 })}
                            </span>
                            <span
                                className="text-right text-[13px] font-semibold font-(family-name:--font-mono)"
                                style={{ color: textColor }}
                            >
                                {c.change_pct != null ? `${isUp ? '+' : ''}${pct.toFixed(2)}%` : '—'}
                            </span>
                            <span className="text-right text-[11px] text-(--color-text-tertiary)">
                                {formatMarketCap(c.market_cap)}
                            </span>
                        </Link>
                    )
                })
            )}
        </div>
    )
}