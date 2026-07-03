import Link from 'next/link'
import Image from 'next/image'
import {
    FaFacebookF,
    FaXTwitter,
    FaLinkedinIn,
    FaYoutube,
} from 'react-icons/fa6'

const columns: { heading: string; links: { label: string; href: string }[] }[] = [
    {
        heading: 'Markets',
        links: [
            { label: 'Stocks', href: '/markets/stocks' },
            { label: 'Bonds', href: '/markets/bonds' },
            { label: 'Indices', href: '/markets/indices' },
            { label: 'IPOs', href: '/markets/ipos' },
            { label: 'Corporate Actions', href: '/markets/corporate-actions' },
        ],
    },
    {
        heading: 'Explore',
        links: [
            { label: 'News', href: '/news' },
            { label: 'Research', href: '/research' },
            { label: 'Learn', href: '/learn' },
            { label: 'Community', href: '/community' },
            { label: 'Watchlist', href: '/watchlist' },
        ],
    },
    {
        heading: 'Tools',
        links: [
            { label: 'Stock Screener', href: '/markets/screeners' },
            { label: 'Market Calendar', href: '/markets/calendar' },
            { label: 'Portfolio Tracker', href: '/simulator' },
            { label: 'Economy', href: '/economy' },
        ],
    },
]

const socials = [
    { Icon: FaFacebookF, label: 'Facebook' },
    { Icon: FaXTwitter, label: 'X' },
    { Icon: FaLinkedinIn, label: 'LinkedIn' },
    { Icon: FaYoutube, label: 'YouTube' },
]

export function Footer() {
    return (
        <footer className="border-t-[0.5px] border-(--color-border-tertiary) bg-(--color-background-secondary)">
            <div className="mx-auto max-w-7xl px-2 py-10 sm:px-4 lg:px-6">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
                    {/* Brand */}
                    <div>
                        <Link href="/" className="flex items-center gap-2.5 text-[16px] font-semibold text-(--color-text-primary) no-underline">
                            <Image src="/logo.png" alt="Malawi Investor" width={28} height={28} className="h-[28px] w-[28px] object-contain" />
                            Malawi Investor
                        </Link>
                        <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-(--color-text-tertiary)">
                            Empowering investors with data, knowledge, and insights to build wealth and grow Malawi&apos;s economy.
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                            {socials.map(({ Icon, label }) => (
                                <span
                                    key={label}
                                    aria-label={label}
                                    title={`${label} (coming soon)`}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border-[0.5px] border-(--color-border-tertiary) text-(--color-text-tertiary)"
                                >
                                    <Icon size={14} aria-hidden="true" />
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {columns.map((col) => (
                        <div key={col.heading}>
                            <p className="mb-3 text-[12px] font-bold tracking-wide text-(--color-text-primary) uppercase">{col.heading}</p>
                            <ul className="space-y-2">
                                {col.links.map((l) => (
                                    <li key={l.label}>
                                        <Link
                                            href={l.href}
                                            className="text-[13px] text-(--color-text-tertiary) no-underline transition-colors hover:text-(--color-text-primary)"
                                        >
                                            {l.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Newsletter */}
                    <div>
                        <p className="mb-3 text-[12px] font-bold tracking-wide text-(--color-text-primary) uppercase">Stay Updated</p>
                        <p className="mb-3 text-[13px] text-(--color-text-tertiary)">Subscribe to our newsletter</p>
                        <form className="flex items-center gap-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-3 py-2 text-[13px] text-(--color-text-primary) placeholder:text-(--color-text-tertiary) outline-none focus:border-(--color-border-primary)"
                            />
                            <button
                                type="submit"
                                className="shrink-0 rounded-(--border-radius-md) bg-(--color-brand) px-3.5 py-2 text-[13px] font-semibold text-[#062012] transition-colors hover:bg-(--color-brand-hover)"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t-[0.5px] border-(--color-border-tertiary) pt-5 text-[12px] text-(--color-text-tertiary) sm:flex-row">
                    <p>© {new Date().getFullYear()} Malawi Investor. All rights reserved.</p>
                    <p>
                        Built with <span className="text-(--color-text-danger)">♥</span> for Malawi
                    </p>
                </div>
            </div>
        </footer>
    )
}