import { createClient } from '@/lib/supabase/server'
import WatchlistClient from './WatchlistClient'

export default async function WatchlistPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: watchlist } = await supabase
        .from('watchlists')
        .select('*, mse_counters(id, symbol, company_name, sector)')
        .eq('user_id', user?.id ?? '')

    const { data: counters } = await supabase
        .from('mse_counters')
        .select('*')
        .order('symbol')

    const { data: prices } = await supabase
        .from('mse_prices')
        .select('*')
        .order('price_date', { ascending: false })

    const latestPrices: Record<number, any> = {}
    prices?.forEach(p => {
        if (!latestPrices[p.counter_id]) latestPrices[p.counter_id] = p
    })

    return (
        <WatchlistClient
            watchlist={watchlist ?? []}
            counters={counters ?? []}
            latestPrices={latestPrices}
            userId={user?.id ?? ''}
        />
    )
}