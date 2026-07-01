// app/(public)/markets/indices/page.tsx
// MSE benchmark indices — MASI, MDSI (Domestic), MFSI (Foreign).
// Data is scraped daily from afx.kwayisi.org/mse/ into `mse_indices`
// (see scripts/scrape_mse.py: scrape_indices()). Only MASI gets an
// absolute index level from that source — MDSI/MFSI are published
// there only as day/week/YTD % changes, so their `value` stays null
// and the UI surfaces that explicitly rather than faking a number.

import { Info, ExternalLink } from 'lucide-react'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { IndexCard } from '@/components/markets/IndexCard'
import { TrendChart } from '@/components/home/TrendChart'
import type { MseIndex } from '@/types/database'

const INDEX_NAMES: Record<string, string> = {
    MASI: 'Malawi All Share Index',
    MDSI: 'Malawi Domestic Share Index',
    MFSI: 'Malawi Foreign Share Index',
}

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

function formatMarketCap(n: number | null | undefined): string {
    if (!n) return '—'
    if (n >= 1_000_000_000_000) return `MK ${(n / 1_000_000_000_000).toFixed(2)}T`
    if (n >= 1_000_000_000) return `MK ${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `MK ${(n / 1_000_000).toFixed(0)}M`
    return `MK ${n.toLocaleString('en')}`
}

function formatDate(d: string | null): string | null {
    if (!d) return null
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function IndicesPage() {
    const supabase = getServiceClient()

    // Latest row per index code.
    const { data: rows } = await supabase
        .from('mse_indices')
        .select('id, index_code, value, day_change_pct, week_change_pct, ytd_change_pct, market_cap, index_date')
        .order('index_date', { ascending: false })
        .limit(30)

    const latestByCode = new Map<string, MseIndex>()
    for (const row of (rows ?? []) as MseIndex[]) {
        if (!latestByCode.has(row.index_code)) {
            latestByCode.set(row.index_code, row)
        }
    }

    const masi = latestByCode.get('MASI') ?? null
    const mdsi = latestByCode.get('MDSI') ?? null
    const mfsi = latestByCode.get('MFSI') ?? null
    const hasAnyData = latestByCode.size > 0
    const marketCap = masi?.market_cap ?? null

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-[20px] font-semibold text-(--color-text-primary)">Indices</h1>
                    <p className="mt-0.5 text-[13px] text-(--color-text-tertiary)">
                        MASI, MDSI & MFSI — Malawi Stock Exchange benchmark indices
                    </p>
                </div>
                <a
                    href="https://afx.kwayisi.org/mse/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) px-3 py-1.5 text-[12px] font-medium text-(--color-text-secondary) no-underline transition-colors hover:bg-(--color-background-secondary)"
                >
                    <ExternalLink size={12} aria-hidden="true" />
                    Source data
                </a>
            </div>

            {!hasAnyData ? (
                <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-6 text-center shadow-(--shadow-card)">
                    <p className="text-[13px] text-(--color-text-tertiary)">
                        No index data yet. Run the daily scraper to populate MASI, MDSI & MFSI.
                    </p>
                </div>
            ) : (
                <>
                    {/* Index cards */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {(['MASI', 'MDSI', 'MFSI'] as const).map((code) => {
                            const row = latestByCode.get(code) ?? null
                            return (
                                <IndexCard
                                    key={code}
                                    code={code}
                                    name={INDEX_NAMES[code]}
                                    value={row?.value ?? null}
                                    dayChange={row?.day_change_pct ?? null}
                                    weekChange={row?.week_change_pct ?? null}
                                    ytdChange={row?.ytd_change_pct ?? null}
                                    asOf={formatDate(row?.index_date ?? null)}
                                />
                            )
                        })}
                    </div>

                    {/* Total market cap */}
                    {marketCap !== null && (
                        <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-3.5 shadow-(--shadow-card)">
                            <p className="text-[11px] font-medium tracking-wide text-(--color-text-tertiary) uppercase">
                                Total MSE market capitalization
                            </p>
                            <p className="mt-1 text-[20px] font-bold text-(--color-text-primary) leading-none">
                                {formatMarketCap(marketCap)}
                            </p>
                        </div>
                    )}

                    {/* MASI chart — the only index with an absolute level history */}
                    {masi?.value !== null && masi !== null && (
                        <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
                            <div className="flex items-center justify-between border-b-[0.5px] border-(--color-border-tertiary) px-4 py-2.5">
                                <p className="text-[11px] font-bold tracking-wider text-(--color-text-tertiary) uppercase">
                                    MASI — Index Level
                                </p>
                            </div>
                            <div className="p-4">
                                <TrendChart indexCode="MASI" label="MASI level" defaultRange="5D" />
                            </div>
                        </div>
                    )}

                    {/* MDSI / MFSI synthetic charts — these two never publish an
                        absolute level, so the chart reconstructs one by chaining
                        daily % changes onto a base of 100. Only valid across
                        consecutive trading days, hence the explicit "rebased"
                        labeling and the disclaimer below. */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {mdsi?.day_change_pct !== null && mdsi !== null && (
                            <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
                                <div className="flex items-center justify-between border-b-[0.5px] border-(--color-border-tertiary) px-4 py-2.5">
                                    <p className="text-[11px] font-bold tracking-wider text-(--color-text-tertiary) uppercase">
                                        MDSI — Synthetic Level
                                    </p>
                                </div>
                                <div className="p-4">
                                    <TrendChart indexCode="MDSI" label="MDSI (rebased to 100)" defaultRange="5D" />
                                </div>
                            </div>
                        )}
                        {mfsi?.day_change_pct !== null && mfsi !== null && (
                            <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
                                <div className="flex items-center justify-between border-b-[0.5px] border-(--color-border-tertiary) px-4 py-2.5">
                                    <p className="text-[11px] font-bold tracking-wider text-(--color-text-tertiary) uppercase">
                                        MFSI — Synthetic Level
                                    </p>
                                </div>
                                <div className="p-4">
                                    <TrendChart indexCode="MFSI" label="MFSI (rebased to 100)" defaultRange="5D" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Data notice */}
                    <div className="flex items-start gap-2.5 rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-info) p-3.5">
                        <Info size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-text-info)' }} aria-hidden="true" />
                        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-text-info)' }}>
                            MASI is the only index published with an absolute level by our source. MDSI and MFSI
                            never publish one — their charts above are a synthetic level we reconstruct by chaining
                            daily % changes onto a base of 100, which is only valid across consecutive trading days
                            we&apos;ve actually tracked (older, sparsely backfilled snapshots can&apos;t be chained
                            this way, so those charts reflect only the period since live daily tracking began).
                            Figures are scraped daily and may lag the official Malawi Stock Exchange feed by a
                            trading day.
                        </p>
                    </div>
                </>
            )}
        </div>
    )
}
