// app/api/admin/recategorize-news/route.ts
// One-off repair tool: re-runs categorizeHeadline() against every
// existing news_items row and updates its category if it changed.
// Useful right after adding/adjusting the keyword rules in
// lib/news/categorize.ts, so old headlines aren't stuck in whatever
// category they got on first fetch.

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { categorizeHeadline } from '@/lib/news/categorize'

export async function POST() {
    const supabase = await createClient()

    const { data: rows } = await supabase.from('news_items').select('id, headline, summary, category')

    let updated = 0
    let unchanged = 0
    const errors: string[] = []

    for (const row of rows ?? []) {
        const newCategory = categorizeHeadline(row.headline, row.summary)
        if (newCategory === row.category) {
            unchanged++
            continue
        }
        const { error } = await supabase.from('news_items').update({ category: newCategory }).eq('id', row.id)
        if (error) {
            errors.push(`#${row.id}: ${error.message}`)
        } else {
            updated++
        }
    }

    if (updated > 0) {
        revalidatePath('/news')
        revalidatePath('/')
    }

    return NextResponse.json({ updated, unchanged, errors })
}