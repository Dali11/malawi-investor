import { createClient } from '@/lib/supabase/server'
import RankingsClient from './RankingsClient'

export default async function RankingsPage() {
    const supabase = await createClient()

    const { data: counters } = await supabase
        .from('mse_counters')
        .select('*')

    const { data: prices } = await supabase
        .from('mse_prices')
        .select('*')
        .order('price_date', { ascending: false })

    const latestPrices: Record<number, any> = {}
    prices?.forEach(p => {
        if (!latestPrices[p.counter_id]) latestPrices[p.counter_id] = p
    })

    const ranked = counters
        ?.map((c: any) => ({ ...c, latest: latestPrices[c.id] ?? null }))
        .filter((c: any) => c.latest !== null) ?? []

    return <RankingsClient counters={ranked} />
}