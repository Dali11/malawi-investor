'use client'
import { useState } from 'react'
import Link from 'next/link'

type SortKey = 'pe_ratio' | 'market_cap' | 'change_pct' | 'price'

export default function RankingsClient({ counters }: any) {
    const [sortBy, setSortBy] = useState<SortKey>('market_cap')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

    function toggleSort(key: SortKey) {
        if (sortBy === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(key)
            setSortDir(key === 'pe_ratio' ? 'asc' : 'desc')
        }
    }

    const sorted = [...counters].sort((a: any, b: any) => {
        const aVal = Number(a.latest?.[sortBy] ?? 0)
        const bVal = Number(b.latest?.[sortBy] ?? 0)
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })

    const sortLabel: Record<SortKey, string> = {
        pe_ratio: 'PE Ratio',
        market_cap: 'Market Cap',
        change_pct: 'Change %',
        price: 'Price'
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-medium text-gray-900">MSE Rankings</h1>
                <p className="text-sm text-gray-500 mt-0.5">Sort all counters by key investment metrics</p>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
                {(Object.keys(sortLabel) as SortKey[]).map(key => (
                    <button
                        key={key}
                        onClick={() => toggleSort(key)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${sortBy === key ? 'bg-amber-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        {sortLabel[key]}
                        {sortBy === key && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Rank</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Symbol</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Company</th>
                            <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Price (MK)</th>
                            <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Change</th>
                            <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">PE Ratio</th>
                            <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Market Cap</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((c: any, index: number) => (
                            <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-gray-100 text-gray-600' : index === 2 ? 'bg-orange-50 text-orange-600' : 'text-gray-400'}`}>
                                        #{index + 1}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <Link href={`/mse/${c.symbol}`} className="font-medium text-amber-600 hover:underline">
                                        {c.symbol}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-gray-700">{c.company_name}</td>
                                <td className="px-4 py-3 text-right text-gray-900">
                                    {Number(c.latest?.price ?? 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {c.latest?.change_pct != null ? (
                                        <span className={Number(c.latest.change_pct) >= 0 ? 'text-green-600' : 'text-red-500'}>
                                            {Number(c.latest.change_pct) >= 0 ? '+' : ''}{Number(c.latest.change_pct).toFixed(2)}%
                                        </span>
                                    ) : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-600">
                                    {c.latest?.pe_ratio ?? '—'}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-600">
                                    {c.latest?.market_cap ? `MK ${(Number(c.latest.market_cap) / 1e9).toFixed(1)}B` : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}