// app/api/admin/fetch-news/route.ts
// Pulls fresh headlines from configured Malawi business/economy RSS
// feeds, de-dupes against existing news_items (by source_url), and
// inserts new ones with a short, non-verbatim excerpt as the summary.
//
// Triggered manually from the "Fetch latest" button on /admin/news.
// Nothing here sends users off-site — we only ever store our own short
// excerpt + a source_url for attribution; the UI does not link out to it.

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { excerpt, fetchArticleImage, parseRssFeed } from '@/lib/rss'
import { NEWS_SOURCES } from '@/lib/sources'

const MAX_PER_SOURCE = 10

/** Strips tracking params, fragments, and trailing slashes so the same
 *  article isn't treated as "new" just because the URL varies slightly
 *  between feed fetches. */
function normalizeUrl(url: string): string {
    try {
        const u = new URL(url)
        u.search = ''
        u.hash = ''
        return u.toString().replace(/\/$/, '')
    } catch {
        return url
    }
}

export async function POST() {
    const supabase = await createClient()

    const { data: existing } = await supabase.from('news_items').select('source_url')
    const knownUrls = new Set(
        (existing ?? []).map((r) => r.source_url).filter(Boolean).map((u) => normalizeUrl(u as string)),
    )

    let inserted = 0
    let skipped = 0
    const errors: string[] = []

    for (const source of NEWS_SOURCES) {
        try {
            const res = await fetch(source.feedUrl, {
                headers: { 'User-Agent': 'MalawiInvestorBot/1.0 (+https://malawi-investor.vercel.app)' },
                // Feeds change slowly; avoid hammering the source on repeat clicks.
                next: { revalidate: 0 },
            })
            if (!res.ok) {
                errors.push(`${source.name}: HTTP ${res.status}`)
                continue
            }
            const xml = await res.text()
            const items = parseRssFeed(xml).slice(0, MAX_PER_SOURCE)

            for (const item of items) {
                const link = normalizeUrl(item.link)
                if (knownUrls.has(link)) {
                    skipped++
                    continue
                }

                const imageUrl = item.imageUrl ?? (await fetchArticleImage(item.link))

                const { error } = await supabase.from('news_items').insert({
                    counter_id: null,
                    headline: item.title,
                    summary: item.description ? excerpt(item.description) : null,
                    source_name: source.name,
                    source_url: link,
                    published_at: (item.publishedAt ?? new Date().toISOString()).slice(0, 10),
                    image_url: imageUrl,
                })

                if (error) {
                    // Unique-constraint hit (race, or URL variant we didn't catch above) — not a real error.
                    if (error.code === '23505') {
                        skipped++
                    } else {
                        errors.push(`${source.name}: ${error.message}`)
                    }
                } else {
                    knownUrls.add(link)
                    inserted++
                }
            }
        } catch (e: any) {
            errors.push(`${source.name}: ${e.message ?? 'fetch failed'}`)
        }
    }

    if (inserted > 0) {
        revalidatePath('/news')
        revalidatePath('/')
    }

    return NextResponse.json({ inserted, skipped, errors })
}