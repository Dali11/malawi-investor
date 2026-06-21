import { createClient } from '@/lib/supabase/server'
import CompareClient from './CompareClient'


export default async function ComparePage() {
    const supabase = await createClient()

    const { data: counters } = await supabase
        .from('mse_counters')
        .select('*')
        .order('symbol')

    const { data: prices } = await supabase
        .from('mse_prices')
        .select('*, mse_counters(symbol)')
        .order('price_date', { ascending: true })

    return (
        <CompareClient counters={counters ?? []} prices={prices ?? []} />
    )
}