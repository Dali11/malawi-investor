// app/api/cron/check-alerts/route.ts
// Runs once daily via Vercel Cron (see vercel.json). Compares every
// active price_alerts row against that counter's latest mse_prices
// row; anything that's crossed its target gets marked 'triggered' and
// gets a notifications row created for the user to see in-app.
//
// IMPORTANT: the schedule in vercel.json (currently 07:00 UTC) is a
// placeholder — it needs to run AFTER whatever time the scraper
// (scrape_mse.py) actually finishes updating that day's prices, or
// this will be checking yesterday's numbers. That scraper isn't
// scheduled from within this repo (no cron/workflow found for it), so
// coordinate the time with however it's actually being run.

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

export async function GET(request: Request) {
    // Vercel sets this automatically on cron-triggered requests when a
    // CRON_SECRET env var exists on the project. Without this check,
    // anyone who found this URL could trigger it manually.
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    const { data: alerts } = await supabase
        .from('price_alerts')
        .select('id, user_id, counter_id, target_price, direction')
        .eq('status', 'active')

    const activeAlerts = alerts ?? []
    if (activeAlerts.length === 0) {
        return NextResponse.json({ checked: 0, triggered: 0 })
    }

    const counterIds = [...new Set(activeAlerts.map((a) => a.counter_id))]

    // Latest price per counter: fetch recent rows for these counters
    // and keep the newest one per counter_id (Supabase JS doesn't have
    // a clean "distinct on" — cheaper to do this reduction in-memory
    // than run one query per counter).
    const { data: priceRows } = await supabase
        .from('mse_prices')
        .select('counter_id, price, price_date')
        .in('counter_id', counterIds)
        .order('price_date', { ascending: false })

    const latestPriceByCounter = new Map<number, number>()
    for (const row of priceRows ?? []) {
        if (!latestPriceByCounter.has(row.counter_id)) {
            latestPriceByCounter.set(row.counter_id, Number(row.price))
        }
    }

    const { data: counters } = await supabase
        .from('mse_counters')
        .select('id, symbol')
        .in('id', counterIds)
    const symbolByCounter = new Map((counters ?? []).map((c) => [c.id, c.symbol]))

    let triggeredCount = 0

    for (const alert of activeAlerts) {
        const price = latestPriceByCounter.get(alert.counter_id)
        if (price == null) continue

        const target = Number(alert.target_price)
        const hit = alert.direction === 'above' ? price >= target : price <= target
        if (!hit) continue

        const symbol = symbolByCounter.get(alert.counter_id) ?? 'A counter'

        await supabase
            .from('price_alerts')
            .update({ status: 'triggered', triggered_at: new Date().toISOString() })
            .eq('id', alert.id)

        await supabase.from('notifications').insert({
            user_id: alert.user_id,
            type: 'price_alert',
            title: `${symbol} hit your target`,
            body: `${symbol} is now MK ${price.toFixed(2)}, ${alert.direction === 'above' ? 'at or above' : 'at or below'} your target of MK ${target.toFixed(2)}.`,
            link: `/stocks/${symbol.toLowerCase()}`,
        })

        triggeredCount++
    }

    return NextResponse.json({ checked: activeAlerts.length, triggered: triggeredCount })
}