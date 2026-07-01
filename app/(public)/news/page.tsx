// app/(public)/news/page.tsx
// Short-form news headlines feed — market wire, press releases, MSE
// circulars. Distinct from /research (long-form analysis with a byline
// and financial snapshots): this is quick factual headlines linking out
// to their original source. Backed by `news_items`
// (scripts/news_items_schema.sql), entered via /admin/news.

import { Newspaper } from 'lucide-react'
import Link from 'next/link'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import ComingSoon from '@/components/home/ComingSoon'
import { NewsFeed, type NewsItemRow } from './NewsFeed'

export const revalidate = 3600 // re-fetch at most once per hour

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

export default async function NewsPage() {
    const supabase = getServiceClient()

    const { data: rawItems } = await supabase
        .from('news_items')
        .select('id, headline, summary, source_name, source_url, published_at, mse_counters(symbol)')
        .order('published_at', { ascending: false })
        .limit(200)

    const items: NewsItemRow[] = (rawItems ?? []).map((n: any) => ({
        id: n.id,
        symbol: n.mse_counters?.symbol ?? null,
        headline: n.headline,
        summary: n.summary,
        source_name: n.source_name,
        source_url: n.source_url,
        published_at: n.published_at,
    }))

    if (items.length === 0) {
        return (
            <ComingSoon
                icon={Newspaper}
                title="News"
                description="Quick headlines from the MSE and Malawian financial press. Check back soon — items are added as they're published."
            />
        )
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-[20px] font-semibold text-(--color-text-primary)">News</h1>
                <p className="mt-0.5 text-[13px] text-(--color-text-tertiary)">
                    {items.length} headline{items.length === 1 ? '' : 's'} from the MSE and Malawian financial press — for in-depth commentary, see{' '}
                    <Link href="/research" className="text-(--color-text-info) no-underline hover:underline">Research</Link>
                </p>
            </div>

            <NewsFeed items={items} />
        </div>
    )
}
