import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { getSymbol, type PriceMover } from '@/types/home'

function MoverSection({
    title,
    Icon,
    movers,
    positive,
    emptyLabel,
    showDivider,
}: {
    title: string
    Icon: typeof TrendingUp
    movers: PriceMover[]
    positive: boolean
    emptyLabel: string
    showDivider: boolean
}) {
    const textVar = positive ? 'var(--color-text-success)' : 'var(--color-text-danger)'
    const bgVar = positive ? 'var(--color-background-success)' : 'var(--color-background-danger)'

    return (
        <div className={showDivider ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}>
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: bgVar }}>
                <Icon size={13} style={{ color: textVar }} aria-hidden="true" />
                <p className="text-[11px] font-bold tracking-widest text-(--color-text-secondary) uppercase">{title}</p>
            </div>
            {movers.length === 0 ? (
                <p className="px-4 py-3 text-[13px] text-(--color-text-tertiary)">{emptyLabel}</p>
            ) : (
                movers.map((p, i) => {
                    const symbol = getSymbol(p.mse_counters)
                    return (
                        <Link
                            key={i}
                            href={`/mse/${symbol?.toLowerCase()}`}
                            className={`flex items-center justify-between px-4 py-2.5 no-underline transition-colors hover:bg-(--color-background-secondary) ${i < movers.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                        >
                            <span className="text-[13px] font-medium text-(--color-text-primary)">{symbol}</span>
                            <span
                                className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold font-(family-name:--font-mono)"
                                style={{ color: textVar, background: bgVar }}
                            >
                                {positive ? '+' : ''}{Number(p.change_pct).toFixed(2)}%
                            </span>
                        </Link>
                    )
                })
            )}
        </div>
    )
}

export function MarketMovers({ gainers, losers }: { gainers: PriceMover[]; losers: PriceMover[] }) {
    return (
        <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-[var(--shadow-card)]">
            <MoverSection title="Top gainers" Icon={TrendingUp} movers={gainers} positive emptyLabel="No gainers today" showDivider={true} />
            <MoverSection title="Top losers" Icon={TrendingDown} movers={losers} positive={false} emptyLabel="No losers today" showDivider={false} />
        </div>
    )
}