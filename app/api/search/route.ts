import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

    if (q.length < 2) return NextResponse.json({ articles: [], counters: [], glossary: [] })

    const supabase = await createClient()
    const search = `%${q}%`

    const [{ data: articles }, { data: counters }, { data: glossary }] = await Promise.all([
        supabase
            .from('analyses')
            .select('id, title, created_at, image_url, mse_counters(symbol)')
            .eq('published', true)
            .ilike('title', search)
            .limit(5),

        supabase
            .from('mse_counters')
            .select('symbol, company_name')
            .or(`symbol.ilike.${search},company_name.ilike.${search}`)
            .limit(5),

        supabase
            .from('glossary')
            .select('id, term, definition')
            .ilike('term', search)
            .limit(4),
    ])

    return NextResponse.json({
        articles: articles ?? [],
        counters: counters ?? [],
        glossary: glossary ?? [],
    })
}