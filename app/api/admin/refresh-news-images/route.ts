// app/api/admin/refresh-news-images/route.ts
// One-off repair tool: re-derives image_url for existing news_items rows
// using the improved article-image extraction (lib/news/rss.ts), for
// rows that currently have no image or were stuck with a generic
// site-logo image from the old og:image-only fallback.

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { fetchArticleImage } from '@/lib/rss'

export async function POST() {
    const supabase = await createClient()

    const { data: rows } = await supabase
        .from('news_items')
        .select('id, source_url, image_url')
        .not('source_url', 'is', null)

    let updated = 0
    let unchanged = 0
    const errors: string[] = []

    for (const row of rows ?? []) {
        // Only touch rows that look logo-only or have no image at all —
        // don't clobber images that were fine already.
        const looksLikeLogo = (row.image_url ?? '').toLowerCase().includes('logo')
        if (row.image_url && !looksLikeLogo) {
            unchanged++
            continue
        }

        try {
            const newImage = await fetchArticleImage(row.source_url as string)
            if (newImage && newImage !== row.image_url) {
                const { error } = await supabase.from('news_items').update({ image_url: newImage }).eq('id', row.id)
                if (error) {
                    errors.push(`#${row.id}: ${error.message}`)
                } else {
                    updated++
                }
            } else {
                unchanged++
            }
        } catch (e: any) {
            errors.push(`#${row.id}: ${e.message ?? 'fetch failed'}`)
        }
    }

    if (updated > 0) {
        revalidatePath('/news')
        revalidatePath('/')
    }

    return NextResponse.json({ updated, unchanged, errors })
}