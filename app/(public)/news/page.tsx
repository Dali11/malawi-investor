import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { Flame, TrendingUp, TrendingDown } from 'lucide-react'
import { getSymbol, type PriceMover } from '@/types/home'

function getTopMovers(prices: PriceMover[]) {
    const seen = new Set<string>()
    const latest = prices.filter((p) => {
        const sym = getSymbol(p.mse_counters)
        if (!sym || seen.has(sym)) return false
        seen.add(sym)
        return true
    }).filter((p) => p.change_pct != null)

    const gainers = [...latest]
        .filter((p) => Number(p.change_pct) > 0)
        .sort((a, b) => Number(b.change_pct) - Number(a.change_pct))
        .slice(0, 4)

    const losers = [...latest]
        .filter((p) => Number(p.change_pct) < 0)
        .sort((a, b) => Number(a.change_pct) - Number(b.change_pct))
        .slice(0, 4)

    return { gainers, losers }
}

export default async function AnalysisPage({


    searchParams,
}: {
    searchParams: Promise<{ symbol?: string; sector?: string }>
}) {
    const supabase = await createClient()
    const { symbol, sector } = await searchParams

    // Build the analyses query with optional symbol filter
    let query = supabase
        .from('analyses')
        .select('id, title, content, created_at, image_url, mse_counters(symbol, sector)')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20)

    if (symbol) {
        // filter by counter symbol via join
        query = query.eq('mse_counters.symbol', symbol)
    }

    const [{ data: analyses }, { data: prices }] = await Promise.all([
        query,
        supabase
            .from('mse_prices')
            .select('price, change_pct, mse_counters(symbol)')
            .order('price_date', { ascending: false })
            .limit(48),
    ])

    // client-side sector filter (if your mse_counters has a sector column)
    const filtered = sector && sector !== 'All'
        ? (analyses ?? []).filter((a: any) => a.mse_counters?.sector === sector)
        : (analyses ?? [])

    const featured = filtered[0]
    const rest = filtered.slice(1)
    const { gainers, losers } = getTopMovers(prices ?? [])

   
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">

            {/* ── Main column ── */}
            <div>
                <div className="mb-6">
                    <h1 className="mb-1 text-[22px] font-bold text-(--color-text-primary)">Analysis</h1>
                    <p className="text-[13px] text-(--color-text-tertiary)">MSE stock analysis and market commentary by Bena Nkhoma</p>
                </div>

                {/* Sector filter pills */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {['All', 'Banking', 'Insurance', 'Telecoms', 'Agriculture', 'Energy'].map((f) => (
                        <Link
                            key={f}
                            href={f === 'All' ? '/news' : `/news?sector=${f}`}
                            className={`rounded-full border-[0.5px] px-3 py-1 text-[12px] font-medium transition-colors no-underline ${(f === 'All' && !sector) || sector === f
                                    ? 'border-transparent bg-(--color-text-primary) text-(--color-background-primary)'
                                    : 'border-(--color-border-tertiary) bg-(--color-background-primary) text-(--color-text-secondary) hover:border-(--color-border-secondary)'
                                }`}
                        >
                            {f}
                        </Link>
                    ))}
                </div>

                {/* Hero / featured */}
                {featured && (
                    <Link href={`/news/${featured.id}`} className="no-underline group mb-6 block">
                        <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
                            <div className="h-[220px] w-full overflow-hidden">
                                {(featured as any).image_url ? (
                                    <img src={(featured as any).image_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-[#0c1f3d]">
                                        <svg viewBox="0 0 200 80" className="w-48 opacity-20" fill="none">
                                            <polyline points="0,70 40,50 80,58 120,30 160,42 200,8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-(--border-radius-md) bg-(--color-background-warning) px-2.5 py-1 text-[11px] font-medium text-(--color-text-warning)">
                                        <Flame size={11} aria-hidden="true" /> Latest
                                    </span>
                                    {(featured as any).mse_counters?.symbol && (
                                        <span className="rounded-full bg-(--color-background-info) px-2.5 py-1 text-[11px] font-bold text-(--color-text-info)">
                                            {(featured as any).mse_counters.symbol}
                                        </span>
                                    )}
                                </div>
                                <h2 className="mb-2 text-[20px] font-bold leading-[1.25] text-(--color-text-primary) transition-colors group-hover:text-(--color-text-info)">
                                    {featured.title}
                                </h2>
                                <p className="mb-4 text-[13px] leading-[1.7] text-(--color-text-secondary)">
                                    {featured.content
                                        .replace(/<[^>]*>/g, ' ')
                                        .replace(/&nbsp;/g, ' ')
                                        .replace(/&amp;/g, '&')
                                        .replace(/&lt;/g, '<')
                                        .replace(/&gt;/g, '>')
                                        .replace(/\s+/g, ' ')
                                        .trim()
                                        .slice(0, 200)}…
                                </p>
                                <div className="flex items-center gap-2 text-[12px] text-(--color-text-tertiary)">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-(--color-background-warning) text-[9px] font-bold text-(--color-text-warning)">BN</div>
                                    <span className="font-medium text-(--color-text-secondary)">Dali Kamphani</span>
                                    <span>·</span>
                                    <span>{formatDistanceToNow(new Date(featured.created_at), { addSuffix: true })}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                )}

                {/* Article grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {rest.map((a: any) => (
                        <Link key={a.id} href={`/news/${a.id}`} className="no-underline group">
                            <div className="h-full overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
                                <div className="h-[120px] w-full overflow-hidden">
                                    {a.image_url ? (
                                        <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-[#0c1f3d]">
                                            <svg viewBox="0 0 60 30" className="w-20 opacity-20" fill="none">
                                                <polyline points="0,25 15,18 30,21 45,8 60,12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    {a.mse_counters?.symbol && (
                                        <span className="mb-2 inline-block rounded-full bg-(--color-background-info) px-2 py-0.5 text-[10px] font-bold text-(--color-text-info)">
                                            {a.mse_counters.symbol}
                                        </span>
                                    )}
                                    <p className="mb-2 text-[13px] font-semibold leading-snug text-(--color-text-primary) transition-colors group-hover:text-(--color-text-info)">
                                        {a.title}
                                    </p>
                                    <p className="text-[11px] text-(--color-text-tertiary)">
                                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Sidebar ── */}
            <div className="hidden lg:block">

                {/* Market movers */}
                <div className="mb-4 overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-[var(--shadow-card)]">
                    <p className="px-4 pt-4 pb-2 text-[11px] font-bold tracking-widest text-(--color-text-tertiary) uppercase">Market movers</p>

                    {/* Gainers */}
                    {gainers.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-(--color-background-success)">
                                <TrendingUp size={12} className="text-(--color-text-success)" aria-hidden="true" />
                                <span className="text-[10px] font-bold tracking-widest text-(--color-text-success) uppercase">Gainers</span>
                            </div>
                            {gainers.map((p, i) => {
                                const sym = getSymbol(p.mse_counters)
                                return (
                                    <Link key={i} href={`/mse/${sym?.toLowerCase()}`} className={`flex items-center justify-between px-4 py-2 no-underline transition-colors hover:bg-(--color-background-secondary) ${i < gainers.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}>
                                        <span className="text-[12px] font-semibold text-(--color-text-primary)">{sym}</span>
                                        <span className="font-mono text-[12px] font-semibold text-(--color-text-success)">+{Number(p.change_pct).toFixed(2)}%</span>
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    {/* Losers */}
                    {losers.length > 0 && (
                        <div className="border-t-[0.5px] border-(--color-border-tertiary)">
                            <div className="flex items-center gap-2 px-4 py-2 bg-(--color-background-danger)">
                                <TrendingDown size={12} className="text-(--color-text-danger)" aria-hidden="true" />
                                <span className="text-[10px] font-bold tracking-widest text-(--color-text-danger) uppercase">Losers</span>
                            </div>
                            {losers.map((p, i) => {
                                const sym = getSymbol(p.mse_counters)
                                return (
                                    <Link key={i} href={`/mse/${sym?.toLowerCase()}`} className={`flex items-center justify-between px-4 py-2 no-underline transition-colors hover:bg-(--color-background-secondary) ${i < losers.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}>
                                        <span className="text-[12px] font-semibold text-(--color-text-primary)">{sym}</span>
                                        <span className="font-mono text-[12px] font-semibold text-(--color-text-danger)">{Number(p.change_pct).toFixed(2)}%</span>
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    <Link href="/mse" className="block border-t-[0.5px] border-(--color-border-tertiary) px-4 py-2.5 text-center text-[11px] font-medium text-(--color-text-info) no-underline hover:underline">
                        View all on MSE →
                    </Link>
                </div>

                {/* Browse by counter */}
                <div className="mb-4 rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-[var(--shadow-card)] p-4">
                    <p className="mb-3 text-[11px] font-bold tracking-widest text-(--color-text-tertiary) uppercase">Browse by counter</p>
                    <div className="flex flex-wrap gap-2">
                        {['NBM', 'FDH', 'STANDARD', 'NICO', 'TNM', 'AIRTEL', 'ILLOVO', 'PCL', 'BHL', 'FMBCH'].map((s) => (
                            <Link key={s} href={`/news?symbol=${s}`} className="no-underline rounded-full bg-(--color-background-secondary) px-2.5 py-1 text-[11px] font-semibold text-(--color-text-secondary) transition-colors hover:bg-(--color-background-info) hover:text-(--color-text-info)">
                                {s}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Newsletter CTA */}
                <div className="rounded-(--border-radius-lg) border-[0.5px] border-[rgba(239,159,39,0.25)] bg-(--color-background-warning) p-4">
                    <p className="mb-1 text-[13px] font-bold text-(--color-text-warning)">Weekly market digest</p>
                    <p className="mb-3 text-[11px] leading-relaxed text-(--color-text-warning) opacity-80">
                        Top MSE moves and analysis every Monday morning.
                    </p>
                    <Link href="/signup" className="block rounded-(--border-radius-md) bg-[#ef9f27] py-2 text-center text-[12px] font-bold text-[#412402] no-underline transition-opacity hover:opacity-90">
                        Subscribe free →
                    </Link>
                </div>
            </div>

        </div>
    )
}