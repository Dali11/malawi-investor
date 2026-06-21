import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function MsePage() {
    const supabase = await createClient()

    const { data: prices } = await supabase
        .from('mse_prices')
        .select('*, mse_counters(symbol, company_name, sector)')
        .order('price_date', { ascending: false })

    const { data: counters } = await supabase
        .from('mse_counters')
        .select('*')
        .order('symbol')

    return (
        <div>
            
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-medium text-gray-900">MSE Tracker</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Malawi Stock Exchange — all 16 counters</p>
                </div>
                <Link href="/mse/compare" className="text-sm bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Compare stocks
                </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Symbol</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Company</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Sector</th>
                            <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Price (MK)</th>
                            <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Change</th>
                            <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">PE Ratio</th>
                            <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Market Cap</th>
                        </tr>
                    </thead>
                    <tbody>
                        {counters && counters.length > 0 ? counters.map((counter: any) => {
                            const latest = prices?.find(p => p.counter_id === counter.id)
                            return (
                                <tr key={counter.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link href={`/mse/${counter.symbol}`} className="font-medium text-amber-600 hover:underline">
                                            {counter.symbol}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{counter.company_name}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">{counter.sector}</td>
                                    <td className="px-4 py-3 text-right text-gray-900">
                                        {latest ? Number(latest.price).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {latest?.change_pct != null ? (
                                            <span className={Number(latest.change_pct) >= 0 ? 'text-green-600' : 'text-red-500'}>
                                                {Number(latest.change_pct) >= 0 ? '+' : ''}{Number(latest.change_pct).toFixed(2)}%
                                            </span>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-600">
                                        {latest?.pe_ratio ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-600">
                                        {latest?.market_cap
                                            ? `MK ${(Number(latest.market_cap) / 1e9).toFixed(1)}B`
                                            : '—'}
                                    </td>
                                </tr>
                            )
                        }) : (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                                    No price data yet. Add prices via the admin panel.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-gray-400 mt-3 text-right">Prices updated daily</p>
        </div>
    )
}