import Link from 'next/link'
import Image from 'next/image'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { MarketStatus } from '@/lib/market-status'

type IndexSnapshot = {
    code: string
    value: number | null
    dayChangePct: number | null
}

type HeroProps = {
    marketStatus: MarketStatus
    indices: IndexSnapshot[]
}

export function Hero({ marketStatus, indices }: HeroProps) {
    return (
        <section className="rounded-(--border-radius-xl) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-secondary)">
            <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8 lg:p-7">
                {/* Copy */}
                <div className="flex-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full border-[0.5px] border-(--color-border-secondary) bg-(--color-background-tertiary) px-3 py-1 text-[11px] font-medium text-(--color-text-secondary)">
                        <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: marketStatus.isOpen ? 'var(--color-text-success)' : 'var(--color-text-tertiary)' }}
                        />
                        {marketStatus.label}
                    </span>

                    <h1 className="mt-3 text-[22px] leading-[1.25] font-semibold tracking-tight text-(--color-text-primary) sm:text-[26px]">
                        Invest with knowledge. Grow with{' '}
                        <span className="text-(--color-brand)">confidence.</span>
                    </h1>

                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                        <Link
                            href="/markets"
                            className="rounded-(--border-radius-md) bg-(--color-brand) px-4 py-2 text-[13px] font-semibold text-[#062012] no-underline transition-colors hover:bg-(--color-brand-hover)"
                        >
                            Explore Markets
                        </Link>
                        <Link
                            href="/learn"
                            className="rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) px-4 py-2 text-[13px] font-medium text-(--color-text-primary) no-underline transition-colors hover:bg-(--color-background-tertiary)"
                        >
                            Learn Investing
                        </Link>
                    </div>
                </div>

                {/* Signature visual: mse.png with the live index card overlapping its corner */}
                <div className="relative hidden aspect-[16/10] w-[260px] shrink-0 sm:block">
                    <Image
                        src="/mse.png"
                        alt="Malawi Stock Exchange"
                        fill
                        sizes="260px"
                        className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) object-cover"
                        priority
                    />
                    {indices.length > 0 && (
                        <div className="absolute -bottom-4 left-3 flex gap-2 rounded-(--border-radius-md) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) px-2.5 py-2 shadow-(--shadow-card)">
                            {indices.map((idx) => (
                                <IndexChip key={idx.code} {...idx} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

function IndexChip({ code, value, dayChangePct }: IndexSnapshot) {
    const isFlat = dayChangePct === null || dayChangePct === 0
    const isUp = !isFlat && dayChangePct! > 0
    const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown
    const color = isFlat
        ? 'var(--color-text-tertiary)'
        : isUp
            ? 'var(--color-text-success)'
            : 'var(--color-text-danger)'

    return (
        <div className="px-1 text-left">
            <p className="text-[10px] font-semibold text-(--color-text-primary)">{code}</p>
            <p className="text-[11px] font-medium text-(--color-text-secondary)">
                {value !== null ? value.toLocaleString('en', { maximumFractionDigits: 0 }) : '—'}
            </p>
            {dayChangePct !== null && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium" style={{ color }}>
                    <Icon size={9} aria-hidden="true" />
                    {isUp ? '+' : ''}{dayChangePct.toFixed(2)}%
                </span>
            )}
        </div>
    )
}