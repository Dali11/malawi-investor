import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { MarketStatus } from '@/lib/market-status'


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
        <section className="overflow-hidden rounded-(--border-radius-xl) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-secondary)">
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

                {/* Signature visual: shrunk skyline graphic with the live index card overlapping its corner */}
                <div className="relative hidden aspect-[16/10] w-[260px] shrink-0 overflow-visible sm:block">
                    <div className="h-full w-full overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary)">
                        <HeroGraphic />
                    </div>
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

/**
 * Original SVG illustration (no stock photography / third-party IP):
 * a dusk skyline silhouette with an ascending market line over it,
 * echoing Blantyre's skyline and the platform's "rising market" idea.
 */
function HeroGraphic() {
    return (
        <svg viewBox="0 0 480 360" className="h-full w-full" preserveAspectRatio="xMidYMax slice">
            <defs>
                <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#141b2b" />
                    <stop offset="60%" stopColor="#0d1420" />
                    <stop offset="100%" stopColor="#0b0f14" />
                </linearGradient>
                <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
            </defs>

            <rect width="480" height="360" fill="url(#sky)" />

            {[...Array(24)].map((_, i) => (
                <circle
                    key={i}
                    cx={(i * 53) % 480}
                    cy={(i * 37) % 140}
                    r={i % 5 === 0 ? 1.4 : 0.8}
                    fill="#ffffff"
                    opacity={0.25 + (i % 4) * 0.12}
                />
            ))}

            <g fill="#1a212c">
                <rect x="0" y="230" width="46" height="130" />
                <rect x="40" y="190" width="34" height="170" />
                <rect x="78" y="250" width="30" height="110" />
                <rect x="112" y="150" width="42" height="210" />
                <rect x="158" y="205" width="28" height="155" />
                <rect x="190" y="120" width="50" height="240" />
                <rect x="244" y="175" width="34" height="185" />
                <rect x="282" y="235" width="30" height="125" />
                <rect x="316" y="160" width="46" height="200" />
                <rect x="366" y="215" width="32" height="145" />
                <rect x="402" y="185" width="38" height="175" />
                <rect x="444" y="245" width="36" height="115" />
            </g>
            <g fill="#f2b84b" opacity="0.55">
                {[46, 60, 120, 128, 200, 214, 324, 338, 410, 424].map((x, i) => (
                    <rect key={i} x={x} y={160 + (i % 4) * 26} width="4" height="6" />
                ))}
            </g>

            <path
                d="M0 300 L60 300 L120 260 L180 270 L240 205 L300 225 L360 150 L420 175 L480 100"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M0 300 L60 300 L120 260 L180 270 L240 205 L300 225 L360 150 L420 175 L480 100 L480 360 L0 360 Z"
                fill="url(#glow)"
            />
        </svg>
    )
}