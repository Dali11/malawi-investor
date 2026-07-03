import { CommunityPulse } from '@/components/home/CommunityPulse'
import { CoursePreviews } from '@/components/home/CoursePreviews'
import { GlossaryPreview } from '@/components/home/GlossaryPreview'
import { Hero } from '@/components/home/Hero'
import { JoinCta } from '@/components/home/JoinCta'
import { LatestNewsPreview } from '@/components/home/LatestNewsPreview'
import { TopAnalysisPreview } from '@/components/home/TopAnalysisPreview'
import { ToolsForInvestors } from '@/components/home/ToolsForInvestors'
import { MarketMovers } from '@/components/home/MarketMovers'
import { createClient } from '@/lib/supabase/server'
import { getMseMarketStatus } from '@/lib/market-status'
import { getSymbol, PriceMover } from '@/types/home'
import type { MseIndex } from '@/types/database'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export default async function HomePage() {
  const supabase = await createClient()

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Latest MASI/MDSI/MFSI snapshot — only fetched/shown for logged-out
  // visitors, since the Hero (and this data) is acquisition-only content.
  let heroIndices: { code: string; value: number | null; dayChangePct: number | null }[] = []
  if (!user) {
    const { data: indexRows } = await serviceSupabase
      .from('mse_indices')
      .select('index_code, value, day_change_pct, index_date')
      .in('index_code', ['MASI', 'MDSI', 'MFSI'])
      .order('index_date', { ascending: false })
      .limit(30)

    const latestByCode = new Map<string, MseIndex>()
    for (const row of (indexRows ?? []) as MseIndex[]) {
      if (!latestByCode.has(row.index_code)) latestByCode.set(row.index_code, row)
    }
    heroIndices = ['MASI', 'MDSI', 'MFSI']
      .map((code) => latestByCode.get(code))
      .filter((row): row is MseIndex => !!row)
      .map((row) => ({ code: row.index_code, value: row.value, dayChangePct: row.day_change_pct }))
  }

  // Featured + latest analyses
  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, title, content, created_at, image_url, mse_counters(symbol)')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(4)

  const featured = analyses?.[0]
  const relatedAnalyses = analyses?.slice(1, 3) ?? []

  // Latest news headlines
  const { data: newsRows } = await serviceSupabase
    .from('news_items')
    .select('id, headline, published_at, source_name, image_url, mse_counters(symbol)')
    .order('published_at', { ascending: false })
    .limit(5)

  const news = (newsRows ?? []).map((n: any) => ({
    id: n.id,
    headline: n.headline,
    published_at: n.published_at,
    source_name: n.source_name,
    image_url: n.image_url,
    symbol: getSymbol(n.mse_counters) ?? null,
  }))

  // Top gainers / losers / most active
  const { data: prices } = await supabase
    .from('mse_prices')
    .select('price, change_pct, market_cap, mse_counters(symbol)')
    .order('price_date', { ascending: false })
    .limit(48)

  const { gainers, losers } = getTopMovers(prices ?? [])
  const mostActive = getMostActive(prices ?? [])

  // Glossary preview
  const { data: glossary } = await serviceSupabase
    .from('glossary_terms')
    .select('id, term, slug, category')
    .eq('published', true)
    .limit(4)

  // Community threads
  const { data: threads } = await supabase
    .from('community_threads')
    .select('id, title, reply_count, mse_counters(symbol)')
    .order('created_at', { ascending: false })
    .limit(6)

  // Course previews
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, level, order_index')
    .eq('published', true)
    .order('order_index', { ascending: true })
    .limit(3)

  return (
    <div className="space-y-8">
      {!user && <Hero marketStatus={getMseMarketStatus()} indices={heroIndices} />}
      <MarketMovers gainers={gainers} losers={losers} mostActive={mostActive} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LatestNewsPreview items={news} />
        {featured ? (
          <TopAnalysisPreview featured={featured} related={relatedAnalyses} />
        ) : (
          <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-4 text-[13px] text-(--color-text-tertiary) shadow-(--shadow-card)">
            No analysis published yet.
          </div>
        )}
        <ToolsForInvestors />
      </div>
      <CommunityPulse threads={threads ?? []} />
      {/* <GlossaryPreview items={glossary ?? []} /> */}
      <CoursePreviews courses={courses ?? []} />
      <JoinCta />
    </div>
  )
}

/**
 * Dedupes by counter symbol (keeping the most recent price per symbol,
 * since prices are already ordered descending by date), then splits
 * into top 3 gainers and top 3 losers by change_pct.
 */
function getTopMovers(prices: PriceMover[]) {
  const seen = new Set<string>()
  const latestPerSymbol = prices.filter((p) => {
    const sym = getSymbol(p.mse_counters)
    if (!sym || seen.has(sym)) return false
    seen.add(sym)
    return true
  }).filter((p) => p.change_pct != null)

  const gainers = [...latestPerSymbol]
    .filter((p) => Number(p.change_pct) > 0)
    .sort((a, b) => b.change_pct - a.change_pct)
    .slice(0, 3)

  const losers = [...latestPerSymbol]
    .filter((p) => Number(p.change_pct) < 0)
    .sort((a, b) => a.change_pct - b.change_pct)
    .slice(0, 3)

  return { gainers, losers }
}

/**
 * Dedupes by counter symbol, then ranks by market_cap descending as a
 * proxy for trading activity — volume isn't tracked yet, see
 * MostActiveCounters.tsx for the same approach used on /markets.
 */
function getMostActive(prices: (PriceMover & { market_cap?: number | null })[]) {
  const seen = new Set<string>()
  const latestPerSymbol = prices.filter((p) => {
    const sym = getSymbol(p.mse_counters)
    if (!sym || seen.has(sym)) return false
    seen.add(sym)
    return true
  })

  return [...latestPerSymbol]
    .sort((a, b) => Number(b.market_cap ?? 0) - Number(a.market_cap ?? 0))
    .slice(0, 3)
}