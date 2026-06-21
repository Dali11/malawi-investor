'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function WatchlistClient({ watchlist, counters, latestPrices, userId }: any) {
    const [adding, setAdding] = useState(false)
    const [selectedCounter, setSelectedCounter] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const watchedIds = new Set(watchlist.map((w: any) => w.counter_id))

    const availableCounters = counters.filter((c: any) => !watchedIds.has(c.id))

    async function addToWatchlist() {
        if (!selectedCounter) return
        setAdding(true)
        await supabase.from('watchlists').insert({
            user_id: userId,
            counter_id: parseInt(selectedCounter)
        })
        setSelectedCounter('')
        setAdding(false)
        router.refresh()
    }

    async function removeFromWatchlist(counterId: number) {
        await supabase.from('watchlists')
            .delete()
            .eq('user_id', userId)
            .eq('counter_id', counterId)
        router.refresh()
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-medium text-gray-900">My Watchlist</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track your favourite MSE counters</p>
                </div>
                <Link href="/mse" className="text-sm text-amber-600 hover:underline">← MSE tracker</Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex gap-3">
                <select
                    value={selectedCounter}
                    onChange={e => setSelectedCounter(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                >
                    <option value="">Add a counter to watchlist</option>
                    {availableCounters.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.symbol} — {c.company_name}</option>
                    ))}
                </select>
                <button
                    onClick={addToWatchlist}
                    disabled={adding || !selectedCounter}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                    {adding ? 'Adding...' : 'Add'}
                </button>
            </div>

            {watchlist.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <p className="text-gray-400 text-sm">Your watchlist is empty.</p>
                    <p className="text-gray-400 text-sm mt-1">Add counters above to track them here.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Symbol</th>
                                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Company</th>
                                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Price (MK)</th>
                                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Change</th>
                                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">PE Ratio</th>
                                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Market Cap</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {watchlist.map((w: any) => {
                                const latest = latestPrices[w.counter_id]
                                return (
                                    <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link href={`/mse/${w.mse_counters?.symbol}`} className="font-medium text-amber-600 hover:underline">
                                                {w.mse_counters?.symbol}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{w.mse_counters?.company_name}</td>
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
                                        <td className="px-4 py-3 text-right text-gray-600">{latest?.pe_ratio ?? '—'}</td>
                                        <td className="px-4 py-3 text-right text-gray-600">
                                            {latest?.market_cap ? `MK ${(Number(latest.market_cap) / 1e9).toFixed(1)}B` : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => removeFromWatchlist(w.counter_id)}
                                                className="text-xs text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}