// app/(public)/layout.tsx
import '../globals.css'
import Link from 'next/link'
import { Search, ChevronUp, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import MobileNav from '@/components/home/MobileNav'
import MarketsDropdown from '@/components/home/MarketsDropdown'
import SearchBox from '@/components/home/SearchBox'
import ThemeToggle from '@/components/home/ThemeToggle'
import AccountButton from '../account/AccountButton'

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch latest prices for the ticker
    const { data: prices } = await supabase
        .from('mse_prices')
        .select('price, change_pct, mse_counters(symbol)')
        .order('price_date', { ascending: false })
        .limit(48)

    const seen = new Set<string>()
    const ticker = (prices ?? []).filter((p: any) => {
        const sym = p.mse_counters?.symbol
        if (!sym || seen.has(sym)) return false
        seen.add(sym)
        return true
    })

    const navLinks = [
        { label: 'Markets', href: '/markets' },
        { label: 'News', href: '/news' },
        { label: 'Research', href: '/research' },
        { label: 'Learn', href: '/learn' },
        { label: 'Community', href: '/community' },
        { label: 'Watchlist', href: '/watchlist' },
    ]

    return (
        <div className="public-shell">
            <header id="site-header" className="sticky top-0 z-50 border-b-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary)">
                <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-6 py-2.5">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 text-[18px] font-semibold text-(--color-text-primary) no-underline">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M3 17l6-6 4 4 8-8" stroke="var(--color-brand)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M15 7h6v6" stroke="var(--color-brand)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Malawi Investor
                        </Link>
                        <nav className="hidden items-center gap-6 text-[16px] text-(--color-text-secondary) md:flex">
                            <MarketsDropdown />
                            {navLinks.filter(({ label }) => label !== 'Markets').map(({ label, href }) => (
                                <Link key={href} href={href} className="no-underline transition-colors hover:text-(--color-text-primary)">
                                    {label}
                                </Link>
                            ))}
                        </nav>
                    </div>


                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        {!user && (
                            <Link
                                href="/login"
                                className="rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) px-3 py-1.5 text-xs font-medium text-(--color-text-primary) no-underline transition-colors hover:bg-(--color-background-secondary)"
                            >
                                Sign in
                            </Link>
                        )}
                        {!user && (
                            <Link
                                href="/signup"
                                className="rounded-(--border-radius-md) bg-(--color-brand) px-3 py-1.5 text-xs font-semibold text-[#062012] no-underline transition-colors hover:bg-(--color-brand-hover)"
                            >
                                Sign up
                            </Link>
                        )}
                        <div>
                            {user && <AccountButton name={user.user_metadata?.full_name ?? user.email ?? ''} />}
                        </div>
                        <MobileNav navLinks={navLinks} user={!!user} />
                        <SearchBox />

                    </div>
                </div>

                {/* Ticker */}
                <div className="overflow-hidden border-t-[0.5px] border-(--color-border-tertiary) bg-(--color-background-secondary) py-2.5">
                    <div className="ticker-track">
                        {[...ticker, ...ticker].map((p: any, i: number) => {
                            const sym = p.mse_counters?.symbol
                            const pct = Number(p.change_pct)
                            const isUp = pct > 0
                            const isDown = pct < 0
                            return (
                                <Link
                                    key={`${sym}-${i}`}
                                    href={`/stocks/${sym?.toLowerCase()}`}
                                    className="flex items-center gap-1.5 border-r-[0.5px] border-(--color-border-tertiary) px-4 text-sm whitespace-nowrap no-underline"
                                >
                                    <span className="font-semibold text-(--color-text-primary)">{sym}</span>
                                    <span className="font-(family-name:--font-mono) text-(--color-text-secondary)">
                                        {Number(p.price).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    {p.change_pct != null && (
                                        <span
                                            className="flex items-center gap-0.5 font-medium"
                                            style={{
                                                color: isUp
                                                    ? 'var(--color-text-success)'
                                                    : isDown
                                                        ? 'var(--color-text-danger)'
                                                        : 'var(--color-text-tertiary)',
                                            }}
                                        >
                                            {isUp && <ChevronUp size={10} aria-hidden="true" />}
                                            {isDown && <ChevronDown size={10} aria-hidden="true" />}
                                            {isUp ? '+' : ''}
                                            {pct.toFixed(2)}%
                                        </span>
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </header>


            <main className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 py-6">
                {children}
            </main>
        </div>
    )
}