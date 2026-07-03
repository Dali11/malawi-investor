import Link from 'next/link'
import { TrendingUp, TrendingDown, Activity, ArrowRight } from 'lucide-react'
import { getSymbol, type PriceMover } from '@/types/home'

export type ActiveMover = PriceMover & { market_cap?: number | null }

function formatCompact(n: number | null | undefined): string {
    if (!n) return '—'
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return `${n}`
}

function MoverRow({
    symbol,
    price,
    href,
    isLast,
    right,
}: {
    symbol?: string
    price: number
    href: string
    isLast: boolean
    right: React.ReactNode
}) {
    return (
        <Link
            href={href}
            className={`flex items-center justify-between px-4 py-2.5 no-underline transition-colors hover:bg-(--color-background-secondary) ${isLast ? '' : 'border-b-[0.5px] border-(--color-border-tertiary)'}`}
        >
            <div>
                <p className="text-[13px] font-semibold text-(--color-text-primary)">{symbol ?? '—'}</p>
                <p className="text-[11px] text-(--color-text-tertiary) font-(family-name:--font-mono)">
                    MWK {Number(price).toLocaleString('en', { minimumFractionDigits: 2 })}
                </p>
            </div>
            {right}
        </Link>
    )
}

function MoverCard({
    title,
    Icon,
    iconColor,
    emptyLabel,
    children,
}: {
    title: string
    Icon: typeof TrendingUp
    iconColor: string
    emptyLabel: string
    children: React.ReactNode
}) {
    const hasChildren = Array.isArray(children) ? children.length > 0 : !!children

    return (
        <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 border-b-[0.5px] border-(--color-border-tertiary) px-4 py-2.5">
                <Icon size={13} style={{ color: iconColor }} aria-hidden="true" />
                <p className="text-[11px] font-bold tracking-widest text-(--color-text-secondary) uppercase">{title}</p>
            </div>
            {hasChildren ? children : (
                <p className="px-4 py-3 text-[13px] text-(--color-text-tertiary)">{emptyLabel}</p>
            )}
        </div>
    )
}

export function MarketMovers({
    gainers,
    losers,
    mostActive,
}: {
    gainers: PriceMover[]
    losers: PriceMover[]
    mostActive?: ActiveMover[]
}) {
    // Legacy layout: single stacked card (gainers on top of losers), used
    // where MarketMovers sits next to another widget (e.g. /markets page).
    if (!mostActive) {
        return (
            <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-[var(--shadow-card)]">
                <div className="border-b-[0.5px] border-(--color-border-tertiary)">
                    <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'var(--color-background-success)' }}>
                        <TrendingUp size={13} style={{ color: 'var(--color-text-success)' }} aria-hidden="true" />
                        <p className="text-[11px] font-bold tracking-widest text-(--color-text-secondary) uppercase">Top gainers</p>
                    </div>
                    {gainers.length === 0 ? (
                        <p className="px-4 py-3 text-[13px] text-(--color-text-tertiary)">No gainers today</p>
                    ) : (
                        gainers.map((p, i) => {
                            const symbol = getSymbol(p.mse_counters)
                            return (
                                <MoverRow
                                    key={i}
                                    symbol={symbol}
                                    price={p.price}
                                    href={`/stocks/${symbol?.toLowerCase()}`}
                                    isLast={i === gainers.length - 1}
                                    right={
                                        <span
                                            className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold font-(family-name:--font-mono)"
                                            style={{ color: 'var(--color-text-success)', background: 'var(--color-background-success)' }}
                                        >
                                            +{Number(p.change_pct).toFixed(2)}%
                                        </span>
                                    }
                                />
                            )
                        })
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'var(--color-background-danger)' }}>
                        <TrendingDown size={13} style={{ color: 'var(--color-text-danger)' }} aria-hidden="true" />
                        <p className="text-[11px] font-bold tracking-widest text-(--color-text-secondary) uppercase">Top losers</p>
                    </div>
                    {losers.length === 0 ? (
                        <p className="px-4 py-3 text-[13px] text-(--color-text-tertiary)">No losers today</p>
                    ) : (
                        losers.map((p, i) => {
                            const symbol = getSymbol(p.mse_counters)
                            return (
                                <MoverRow
                                    key={i}
                                    symbol={symbol}
                                    price={p.price}
                                    href={`/stocks/${symbol?.toLowerCase()}`}
                                    isLast={i === losers.length - 1}
                                    right={
                                        <span
                                            className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold font-(family-name:--font-mono)"
                                            style={{ color: 'var(--color-text-danger)', background: 'var(--color-background-danger)' }}
                                        >
                                            {Number(p.change_pct).toFixed(2)}%
                                        </span>
                                    }
                                />
                            )
                        })
                    )}
                </div>
            </div>
        )
    }

    // New layout: three side-by-side cards (Top gainers / Top losers / Most
    // active), matching the homepage mockup — sits directly under the Hero.
    // Mobile shows gainers + losers only (2-up); Most active joins at sm+.
    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-end">
                <Link
                    href="/stocks"
                    className="flex items-center gap-1 text-[12px] font-medium text-(--color-text-secondary) no-underline hover:text-(--color-text-primary)"
                >
                    View all
                    <ArrowRight size={12} aria-hidden="true" />
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <MoverCard title="Top gainers" Icon={TrendingUp} iconColor="var(--color-text-success)" emptyLabel="No gainers today">
                    {gainers.map((p, i) => {
                        const symbol = getSymbol(p.mse_counters)
                        return (
                            <MoverRow
                                key={i}
                                symbol={symbol}
                                price={p.price}
                                href={`/stocks/${symbol?.toLowerCase()}`}
                                isLast={i === gainers.length - 1}
                                right={
                                    <span
                                        className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold font-(family-name:--font-mono)"
                                        style={{ color: 'var(--color-text-success)', background: 'var(--color-background-success)' }}
                                    >
                                        +{Number(p.change_pct).toFixed(2)}%
                                    </span>
                                }
                            />
                        )
                    })}
                </MoverCard>

                <MoverCard title="Top losers" Icon={TrendingDown} iconColor="var(--color-text-danger)" emptyLabel="No losers today">
                    {losers.map((p, i) => {
                        const symbol = getSymbol(p.mse_counters)
                        return (
                            <MoverRow
                                key={i}
                                symbol={symbol}
                                price={p.price}
                                href={`/stocks/${symbol?.toLowerCase()}`}
                                isLast={i === losers.length - 1}
                                right={
                                    <span
                                        className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold font-(family-name:--font-mono)"
                                        style={{ color: 'var(--color-text-danger)', background: 'var(--color-background-danger)' }}
                                    >
                                        {Number(p.change_pct).toFixed(2)}%
                                    </span>
                                }
                            />
                        )
                    })}
                </MoverCard>

                <div className="hidden sm:block">
                    <MoverCard title="Most active" Icon={Activity} iconColor="var(--color-text-tertiary)" emptyLabel="No data available">
                        {mostActive.map((p, i) => {
                            const symbol = getSymbol(p.mse_counters)
                            return (
                                <MoverRow
                                    key={i}
                                    symbol={symbol}
                                    price={p.price}
                                    href={`/stocks/${symbol?.toLowerCase()}`}
                                    isLast={i === mostActive.length - 1}
                                    right={
                                        <span className="text-[12px] font-medium text-(--color-text-tertiary) font-(family-name:--font-mono)">
                                            {formatCompact(p.market_cap)}
                                        </span>
                                    }
                                />
                            )
                        })}
                    </MoverCard>
                </div>
            </div>
        </div>
    )
}