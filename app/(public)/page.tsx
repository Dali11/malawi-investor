import { CommunityPulse } from '@/components/home/CommunityPulse'
import { CoursePreviews } from '@/components/home/CoursePreviews'
import { FeaturedAnalysis } from '@/components/home/FeaturedAnalysis'
import { GlossaryPreview } from '@/components/home/GlossaryPreview'
import { JoinCta } from '@/components/home/JoinCta'
import { LatestAnalysis } from '@/components/home/LatestAnalysis'
import { MarketMovers } from '@/components/home/MarketMovers'
import { MarketSnapshot } from '@/components/home/MarketSnapshot'
import { createClient } from '@/lib/supabase/server'
import { getSymbol, PriceMover } from '@/types/home'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export default async function HomePage() {
  const supabase = await createClient()

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Featured + latest analyses
  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, title, content, created_at, image_url, mse_counters(symbol)')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(4)

  const featured = analyses?.[0]
  const latest = analyses?.slice(1) ?? []

  // Top gainers / losers
  const { data: prices } = await supabase
    .from('mse_prices')
    .select('price, change_pct, mse_counters(symbol)')
    .order('price_date', { ascending: false })
    .limit(48)

  const { gainers, losers } = getTopMovers(prices ?? [])
  const snapshot = getMarketSnapshot(prices ?? [])

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
      <div className="grid grid-cols-1 gap-6 border-b-[0.5px] border-(--color-border-tertiary) pb-6 lg:grid-cols-[1.3fr_1fr]">
        {featured && <FeaturedAnalysis analysis={featured} related={latest} />}
        <MarketSnapshot movers={snapshot} />
      </div>
      <LatestAnalysis items={latest} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.4fr]">
        <MarketMovers gainers={gainers} losers={losers} />
        <CommunityPulse threads={threads ?? []} />
      </div>
      <GlossaryPreview items={glossary ?? []} />
      <CoursePreviews courses={courses ?? []} />
      <JoinCta />
    </div>
  )
}

/**
 * Combines gainers and losers into one list sorted by the size of the
 * move (regardless of direction), so the biggest swings lead. Returns
 * at least 5 entries when available.
 */
function getMarketSnapshot(prices: PriceMover[], minCount = 5) {
  const seen = new Set<string>()
  const latestPerSymbol = prices.filter((p) => {
    const sym = getSymbol(p.mse_counters)
    if (!sym || seen.has(sym)) return false
    seen.add(sym)
    return true
  }).filter((p) => p.change_pct != null)

  return [...latestPerSymbol]
    .sort((a, b) => Math.abs(Number(b.change_pct)) - Math.abs(Number(a.change_pct)))
    .slice(0, Math.max(minCount, 5))
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