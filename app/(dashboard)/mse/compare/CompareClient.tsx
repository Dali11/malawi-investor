'use client'
import { useState } from 'react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export default function CompareClient({ counters, prices }: any) {
    const [stockA, setStockA] = useState('')
    const [stockB, setStockB] = useState('')

    const counterA = counters.find((c: any) => c.id === parseInt(stockA))
    const counterB = counters.find((c: any) => c.id === parseInt(stockB))

    const pricesA = prices.filter((p: any) => p.counter_id === parseInt(stockA))
    const pricesB = prices.filter((p: any) => p.counter_id === parseInt(stockB))

    const latestA = pricesA[pricesA.length - 1]
    const latestB = pricesB[pricesB.length - 1]

    const allDates = [...new Set(prices
        .filter((p: any) => p.counter_id === parseInt(stockA) || p.counter_id === parseInt(stockB))
        .map((p: any) => p.price_date)
    )].sort()

    const chartData = allDates.map(date => {
        const a = pricesA.find((p: any) => p.price_date === date)
        const b = pricesB.find((p: any) => p.price_date === date)
        return {
            date: new Date(date as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            [counterA?.symbol ?? 'A']: a ? Number(a.price) : undefined,
            [counterB?.symbol ?? 'B']: b ? Number(b.price) : undefined,
        }
    })

    const metrics = [
        { label: 'Latest price', a: latestA ? `MK ${Number(latestA.price).toLocaleString()}` : '—', b: latestB ? `MK ${Number(latestB.price).toLocaleString()}` : '—' },
        { label: 'PE ratio', a: latestA?.pe_ratio ?? '—', b: latestB?.pe_ratio ?? '—' },
        { label: 'Market cap', a: latestA?.market_cap ? `MK ${(Number(latestA.market_cap) / 1e9).toFixed(1)}B` : '—', b: latestB?.market_cap ? `MK ${(Number(latestB.market_cap) / 1e9).toFixed(1)}B` : '—' },
        { label: 'Change today', a: latestA?.change_pct != null ? `${Number(latestA.change_pct) >= 0 ? '+' : ''}${Number(latestA.change_pct).toFixed(2)}%` : '—', b: latestB?.change_pct != null ? `${Number(latestB.change_pct) >= 0 ? '+' : ''}${Number(latestB.change_pct).toFixed(2)}%` : '—' },
        { label: 'Sector', a: counterA?.sector ?? '—', b: counterB?.sector ?? '—' },
    ]

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-medium text-gray-900">Compare stocks</h1>
                <p className="text-sm text-gray-500 mt-0.5">Compare any two MSE counters side by side</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="text-sm text-gray-600 block mb-1">Stock A</label>
                    <select
                        value={stockA}
                        onChange={e => setStockA(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                    >
                        <option value="">Select a counter</option>
                        {counters.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.symbol} — {c.company_name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-sm text-gray-600 block mb-1">Stock B</label>
                    <select
                        value={stockB}
                        onChange={e => setStockB(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                    >
                        <option value="">Select a counter</option>
                        {counters.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.symbol} — {c.company_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {stockA && stockB && (
                <>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
                        <h2 className="text-sm font-medium text-gray-900 mb-4">Price comparison</h2>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={chartData} margin={{ top: 4, right: 4, left: 8, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(1)}K`} />
                                    <Tooltip contentStyle={{ fontSize: 12, border: '0.5px solid #e5e7eb', borderRadius: 8 }} formatter={(value: number) => `MK ${value.toLocaleString()}`} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    {counterA && <Line type="monotone" dataKey={counterA.symbol} stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} connectNulls />}
                                    {counterB && <Line type="monotone" dataKey={counterB.symbol} stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} connectNulls />}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-8">No overlapping price data for these two counters yet.</p>
                        )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Metric</th>
                                    <th className="text-center px-4 py-3 text-xs text-amber-600 font-medium">{counterA?.symbol}</th>
                                    <th className="text-center px-4 py-3 text-xs text-blue-600 font-medium">{counterB?.symbol}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.map(m => (
                                    <tr key={m.label} className="border-b border-gray-50">
                                        <td className="px-4 py-3 text-gray-500 text-xs">{m.label}</td>
                                        <td className="px-4 py-3 text-center font-medium text-gray-900">{m.a}</td>
                                        <td className="px-4 py-3 text-center font-medium text-gray-900">{m.b}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {(!stockA || !stockB) && (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <p className="text-sm text-gray-400">Select two stocks above to compare them</p>
                </div>
            )}
        </div>
    )
}