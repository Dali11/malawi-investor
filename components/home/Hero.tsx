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
        <section className="overflow-hidden rounded-(--border-radius-xl) border-[0.5px] border-(--color-border-tertiary)">
            {/* Mobile: photo is the full hero background, text + index row overlaid on a dark scrim */}
            <div className="relative sm:hidden">
                <div className="absolute inset-0">
                    <Image
                        src="/mwi_banner.png"
                        alt=""
                        fill
                        sizes="100vw"
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/60" />
                </div>
                <div className="relative z-10 flex flex-col gap-4 p-5">
                    <StatusBadge marketStatus={marketStatus} />
                    <h1 className="text-[22px] leading-[1.25] font-semibold tracking-tight text-white">
                        Invest with knowledge. Grow with{' '}
                        <span className="text-(--color-brand)">confidence.</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                            href="/markets"
                            className="rounded-(--border-radius-md) bg-(--color-brand) px-4 py-2 text-[13px] font-semibold text-[#062012] no-underline transition-colors hover:bg-(--color-brand-hover)"
                        >
                            Explore Markets
                        </Link>
                        <Link
                            href="/learn"
                            className="rounded-(--border-radius-md) border-[0.5px] border-white/40 px-4 py-2 text-[13px] font-medium text-white no-underline transition-colors hover:bg-white/10"
                        >
                            Learn Investing
                        </Link>
                    </div>
                    {indices.length > 0 && (
                        <div className="mt-1 flex gap-2 rounded-(--border-radius-md) border-[0.5px] border-white/15 bg-black/40 p-2.5">
                            {indices.map((idx) => (
                                <IndexChip key={idx.code} {...idx} size="lg" />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tablet/desktop: side-by-side, photo takes ~55-60% of the width */}
            <div className="hidden bg-(--color-background-secondary) sm:flex sm:items-stretch">
                <div className="flex w-[42%] shrink-0 flex-col justify-center gap-4 p-6 lg:w-[38%] lg:p-8">
                    <StatusBadge marketStatus={marketStatus} />
                    <h1 className="text-[22px] leading-[1.25] font-semibold tracking-tight text-(--color-text-primary) lg:text-[26px]">
                        Invest with knowledge. Grow with{' '}
                        <span className="text-(--color-brand)">confidence.</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-2.5">
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

                <div className="relative w-[58%] lg:w-[62%]">
                    <Image
                        src="/mwi_banner.png"
                        alt="Blantyre skyline at dusk"
                        fill
                        sizes="(min-width: 1024px) 62vw, 58vw"
                        className="object-cover"
                        priority
                    />
                    {indices.length > 0 && (
                        <div className="absolute bottom-3 left-8 right-6 flex justify-between gap-2 rounded-(--border-radius-md) border-[0.5px] border-white/20 bg-black/35 px-3 py-2 backdrop-blur-sm">
                            {indices.map((idx) => (
                                <IndexChip key={idx.code} {...idx} size="lg" />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

function StatusBadge({ marketStatus }: { marketStatus: MarketStatus }) {
    return (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border-[0.5px] border-(--color-border-secondary) bg-(--color-background-tertiary) px-3 py-1 text-[11px] font-medium text-(--color-text-secondary)">
            <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: marketStatus.isOpen ? 'var(--color-text-success)' : 'var(--color-text-tertiary)' }}
            />
            {marketStatus.label}
        </span>
    )
}

function IndexChip({ code, value, dayChangePct, size = 'sm' }: IndexSnapshot & { size?: 'sm' | 'lg' }) {
    const isFlat = dayChangePct === null || dayChangePct === 0
    const isUp = !isFlat && dayChangePct! > 0
    const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown
    const color = isFlat
        ? 'var(--color-text-tertiary)'
        : isUp
            ? 'var(--color-text-success)'
            : 'var(--color-text-danger)'

    const isLg = size === 'lg'

    return (
        <div className={isLg ? 'flex-1 px-2 py-0.5 text-left' : 'px-1 text-left'}>
            <p className={isLg ? 'text-[12px] font-bold text-white' : 'text-[10px] font-semibold text-(--color-text-primary)'}>
                {code}
            </p>
            <p className={isLg ? 'text-[15px] font-bold text-white' : 'text-[11px] font-medium text-(--color-text-secondary)'}>
                {value !== null ? value.toLocaleString('en', { maximumFractionDigits: 0 }) : '—'}
            </p>
            {dayChangePct !== null && (
                <span className={isLg ? 'flex items-center gap-1 text-[12px] font-semibold' : 'flex items-center gap-0.5 text-[10px] font-medium'} style={{ color }}>
                    <Icon size={isLg ? 11 : 9} aria-hidden="true" />
                    {isUp ? '+' : ''}{dayChangePct.toFixed(2)}%
                </span>
            )}
        </div>
    )
}