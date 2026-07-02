import Link from 'next/link'
import { TrendingUp, BookOpen, Building2 } from 'lucide-react'

type HeroProps = {
    listedCount: number
    articleCount: number
    lessonCount: number
}

export function Hero({ listedCount, articleCount, lessonCount }: HeroProps) {
    return (
        <section className="relative overflow-hidden rounded-(--border-radius-xl) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-secondary)">
            <div className="grid grid-cols-1 gap-8 p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-14">
                {/* Copy */}
                <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border-[0.5px] border-(--color-border-secondary) bg-(--color-background-tertiary) px-3 py-1 text-[12px] font-medium text-(--color-text-secondary)">
                        <span className="h-1.5 w-1.5 rounded-full bg-(--color-brand)" />
                        The Home of Investing in Malawi
                    </span>

                    <h1 className="mt-5 text-[34px] leading-[1.15] font-semibold tracking-tight text-(--color-text-primary) sm:text-[44px]">
                        Invest with knowledge.
                        <br />
                        Grow with{' '}
                        <span className="text-(--color-brand)">confidence.</span>
                    </h1>

                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-(--color-text-secondary)">
                        Your complete platform for Malawi Stock Exchange data, market news,
                        expert analysis, and investor education.
                    </p>

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                        <Link
                            href="/markets"
                            className="rounded-(--border-radius-md) bg-(--color-brand) px-5 py-2.5 text-[14px] font-semibold text-[#062012] no-underline transition-colors hover:bg-(--color-brand-hover)"
                        >
                            Explore Markets
                        </Link>
                        <Link
                            href="/learn"
                            className="rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) px-5 py-2.5 text-[14px] font-medium text-(--color-text-primary) no-underline transition-colors hover:bg-(--color-background-tertiary)"
                        >
                            Learn Investing
                        </Link>
                    </div>

                    <div className="mt-9 grid grid-cols-3 gap-4 border-t-[0.5px] border-(--color-border-tertiary) pt-6">
                        <Stat icon={Building2} value={`${listedCount}+`} label="Listed Companies" />
                        <Stat icon={BookOpen} value={`${articleCount + lessonCount}+`} label="Articles & Lessons" />
                        <Stat icon={TrendingUp} value="Live" label="MSE Market Data" />
                    </div>
                </div>

                {/* Signature visual: stylised Blantyre skyline + rising line */}
                <div className="relative hidden aspect-[4/3] w-full overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) lg:block">
                    <HeroGraphic />
                </div>
            </div>
        </section>
    )
}

function Stat({
    icon: Icon,
    value,
    label,
}: {
    icon: typeof TrendingUp
    value: string
    label: string
}) {
    return (
        <div className="flex items-start gap-2">
            <Icon size={16} className="mt-0.5 shrink-0 text-(--color-brand)" aria-hidden="true" />
            <div>
                <p className="text-[15px] font-semibold text-(--color-text-primary)">{value}</p>
                <p className="text-[11px] leading-tight text-(--color-text-tertiary)">{label}</p>
            </div>
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

            {/* stars */}
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

            {/* skyline silhouette */}
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
            {/* lit windows */}
            <g fill="#f2b84b" opacity="0.55">
                {[46, 60, 120, 128, 200, 214, 324, 338, 410, 424].map((x, i) => (
                    <rect key={i} x={x} y={160 + (i % 4) * 26} width="4" height="6" />
                ))}
            </g>

            {/* rising market line */}
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
