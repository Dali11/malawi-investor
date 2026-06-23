import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default async function AnalysisArticlePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: article } = await supabase
        .from('analyses')
        .select('id, title, content, created_at, image_url, price_at_post, pe_at_post, market_cap_at_post, mse_counters(symbol, company_name)')
        .eq('id', id)
        .eq('published', true)
        .single()

    if (!article) notFound()

    const symbol = (article as any).mse_counters?.symbol
    const company = (article as any).mse_counters?.company_name

    // Related articles — same counter, exclude current
    const { data: related } = symbol ? await supabase
        .from('analyses')
        .select('id, title, created_at, image_url, mse_counters(symbol)')
        .eq('published', true)
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(3) : { data: [] }

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_240px]">

            {/* Main article */}
            <div className="min-w-0">
                {/* Breadcrumb */}
                <div className="mb-5 flex items-center gap-2 text-[12px] text-(--color-text-tertiary)">
                    <Link href="/analysis" className="flex items-center gap-1 text-(--color-text-info) no-underline hover:underline">
                        <ArrowLeft size={12} aria-hidden="true" />
                        Analysis
                    </Link>
                    {symbol && (
                        <>
                            <span>›</span>
                            <Link href={`/mse/${symbol.toLowerCase()}`} className="text-(--color-text-info) no-underline hover:underline">{symbol}</Link>
                        </>
                    )}
                </div>

                {/* Symbol badge */}
                {symbol && (
                    <Link href={`/mse/${symbol.toLowerCase()}`} className="no-underline">
                        <span className="mb-4 inline-flex items-center gap-2 rounded-(--border-radius-md) bg-(--color-background-info) px-3 py-1.5 text-[12px] font-bold text-(--color-text-info)">
                            {symbol} — {company}
                        </span>
                    </Link>
                )}

                {/* Title */}
                <h1 className="mb-4 text-[28px] font-bold leading-[1.2] text-(--color-text-primary)">
                    {article.title}
                </h1>

                {/* Author row */}
                <div className="mb-6 flex items-center gap-3 border-b-[0.5px] border-(--color-border-tertiary) pb-6">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-background-warning) text-[11px] font-bold text-(--color-text-warning)">BN</div>
                    <div>
                        <p className="text-[13px] font-semibold text-(--color-text-primary)">Bena Nkhoma</p>
                        <p className="text-[12px] text-(--color-text-tertiary)">
                            {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                        </p>
                    </div>
                </div>

                {/* Hero image */}
                <div className="mb-6 overflow-hidden rounded-(--border-radius-lg) h-[240px] w-full">
                    {(article as any).image_url ? (
                        <img src={(article as any).image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#0c1f3d]">
                            <svg viewBox="0 0 200 80" className="w-48 opacity-20" fill="none">
                                <polyline points="0,70 30,50 60,58 90,30 120,42 150,15 180,25 200,8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="200" cy="8" r="4" fill="white" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Stat boxes */}
                {(article.price_at_post || article.pe_at_post || article.market_cap_at_post) && (
                    <div className="mb-6 grid grid-cols-3 gap-3">
                        {article.price_at_post && (
                            <div className="rounded-(--border-radius-md) bg-(--color-background-secondary) p-3">
                                <p className="mb-1 text-[11px] text-(--color-text-tertiary)">Price at post</p>
                                <p className="text-[15px] font-bold text-(--color-text-primary)">MK {Number(article.price_at_post).toLocaleString()}</p>
                            </div>
                        )}
                        {article.pe_at_post && (
                            <div className="rounded-(--border-radius-md) bg-(--color-background-secondary) p-3">
                                <p className="mb-1 text-[11px] text-(--color-text-tertiary)">P/E ratio</p>
                                <p className="text-[15px] font-bold text-(--color-text-primary)">{Number(article.pe_at_post).toFixed(2)}x</p>
                            </div>
                        )}
                        {article.market_cap_at_post && (
                            <div className="rounded-(--border-radius-md) bg-(--color-background-secondary) p-3">
                                <p className="mb-1 text-[11px] text-(--color-text-tertiary)">Market cap</p>
                                <p className="text-[15px] font-bold text-(--color-text-primary)">MK {(Number(article.market_cap_at_post) / 1_000_000_000).toFixed(1)}B</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Article body */}
                <div
                    className="mb-10 border-t-[0.5px] border-(--color-border-tertiary) pt-6 bbn-article-body"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />

                {/* Related articles */}
                {related && related.length > 0 && (
                    <div className="border-t-[0.5px] border-(--color-border-tertiary) pt-6">
                        <h3 className="mb-4 text-[16px] font-bold text-(--color-text-primary)">Related analysis</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {related.map((r: any) => (
                                <Link key={r.id} href={`/analysis/${r.id}`} className="no-underline group">
                                    <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
                                        <div className="h-[80px] w-full overflow-hidden">
                                            {r.image_url ? (
                                                <img src={r.image_url} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-[#0c1f3d]">
                                                    <svg viewBox="0 0 40 20" className="w-10 opacity-20" fill="none">
                                                        <polyline points="0,18 10,12 20,14 30,5 40,8" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            {r.mse_counters?.symbol && (
                                                <span className="mb-1.5 inline-block rounded-full bg-(--color-background-info) px-2 py-0.5 text-[9px] font-bold text-(--color-text-info)">
                                                    {r.mse_counters.symbol}
                                                </span>
                                            )}
                                            <p className="text-[12px] font-semibold leading-snug text-(--color-text-primary) group-hover:text-(--color-text-info) transition-colors">
                                                {r.title}
                                            </p>
                                            <p className="mt-1 text-[10px] text-(--color-text-tertiary)">
                                                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block">
                {/* Live price card */}
                {symbol && (
                    <div className="mb-4 rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-[var(--shadow-card)] p-4">
                        <p className="mb-3 text-[11px] font-bold tracking-widest text-(--color-text-tertiary) uppercase">{symbol} price</p>
                        {article.price_at_post && (
                            <p className="text-[26px] font-bold text-(--color-text-primary) mb-1">
                                MK {Number(article.price_at_post).toLocaleString()}
                            </p>
                        )}
                        <div className="mt-3 flex flex-col gap-0">
                            {article.pe_at_post && (
                                <div className="flex justify-between border-b-[0.5px] border-(--color-border-tertiary) py-2">
                                    <span className="text-[12px] text-(--color-text-tertiary)">P/E ratio</span>
                                    <span className="text-[12px] font-semibold text-(--color-text-primary)">{Number(article.pe_at_post).toFixed(2)}x</span>
                                </div>
                            )}
                            {article.market_cap_at_post && (
                                <div className="flex justify-between py-2">
                                    <span className="text-[12px] text-(--color-text-tertiary)">Market cap</span>
                                    <span className="text-[12px] font-semibold text-(--color-text-primary)">MK {(Number(article.market_cap_at_post) / 1_000_000_000).toFixed(1)}B</span>
                                </div>
                            )}
                        </div>
                        <Link href={`/mse/${symbol.toLowerCase()}`} className="mt-3 block rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) py-2 text-center text-[12px] font-semibold text-(--color-text-primary) no-underline transition-colors hover:bg-(--color-background-secondary)">
                            View {symbol} on MSE →
                        </Link>
                    </div>
                )}

                {/* Join CTA */}
                <div className="rounded-(--border-radius-lg) border-[0.5px] border-[rgba(239,159,39,0.25)] bg-(--color-background-warning) p-4">
                    <p className="mb-1 text-[13px] font-bold text-(--color-text-warning)">
                        Track {symbol ?? 'this stock'} in your portfolio
                    </p>
                    <p className="mb-3 text-[11px] leading-relaxed text-(--color-text-warning) opacity-80">
                        Create a free account to save counters and get alerts.
                    </p>
                    <Link href="/signup" className="block rounded-(--border-radius-md) bg-[#ef9f27] py-2 text-center text-[12px] font-bold text-[#412402] no-underline transition-opacity hover:opacity-90">
                        Join free →
                    </Link>
                </div>
            </div>

        </div>
    )
}