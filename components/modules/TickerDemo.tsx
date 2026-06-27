'use client'
import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

type Stock = {
    symbol: string
    price: number
    change: number
    volume: number
}

const initialStocks: Stock[] = [
    { symbol: 'AIRTEL', price: 111.41, change: -0.02, volume: 38400 },
    { symbol: 'NICO', price: 1600.16, change: -0.67, volume: 12100 },
    { symbol: 'SUNBIRD', price: 3100.13, change: 0.0, volume: 5200 },
    { symbol: 'TNM', price: 29.35, change: -0.03, volume: 64900 },
]

export default function TickerDemo({ onFrozen }: { onFrozen?: (stocks: Stock[]) => void }) {
    const [stocks, setStocks] = useState<Stock[]>(initialStocks)
    const [frozen, setFrozen] = useState(false)

    useEffect(() => {
        if (frozen) return
        const interval = setInterval(() => {
            setStocks(prev =>
                prev.map(s => {
                    const drift = (Math.random() - 0.5) * 0.6
                    const newChange = Math.max(-2, Math.min(2, s.change + drift))
                    return {
                        ...s,
                        change: newChange,
                        price: Math.max(1, s.price * (1 + drift / 100)),
                        volume: s.volume + Math.floor(Math.random() * 500),
                    }
                })
            )
        }, 2000)
        return () => clearInterval(interval)
    }, [frozen])

    function handlePause() {
        setFrozen(true)
        onFrozen?.(stocks)
    }

    function handleResume() {
        setFrozen(false)
    }

    return (
        <div className="bg-gray-50 rounded-xl p-5 my-6">
            <p className="text-xs text-gray-500 mb-3">Watch the ticker move</p>

            <table className="w-full text-sm">
                <thead>
                    <tr className="text-xs text-gray-400 text-left">
                        <th className="pb-2">Symbol</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">Change</th>
                        <th className="pb-2 text-right">Volume</th>
                    </tr>
                </thead>
                <tbody>
                    {stocks.map(s => {
                        const isUp = s.change > 0
                        const isDown = s.change < 0
                        return (
                            <tr key={s.symbol} className="border-t border-gray-200">
                                <td className="py-2 font-medium">{s.symbol}</td>
                                <td className="py-2 text-right">{s.price.toFixed(2)}</td>
                                <td
                                    className={`py-2 text-right ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-500'
                                        }`}
                                >
                                    {isUp && <ArrowUpRight size={14} className="inline mr-0.5" />}
                                    {isDown && <ArrowDownRight size={14} className="inline mr-0.5" />}
                                    {s.change.toFixed(2)}%
                                </td>
                                <td className="py-2 text-right text-gray-500">{s.volume.toLocaleString()}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            <div className="border-t border-gray-200 mt-4 pt-4 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    {frozen ? 'Ticker paused' : 'Pause the ticker to answer the questions below'}
                </p>
                <button
                    onClick={frozen ? handleResume : handlePause}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700 border border-amber-200 rounded-full px-3 py-1 flex-shrink-0"
                >
                    {frozen ? 'Resume' : 'Pause'}
                </button>
            </div>
        </div>
    )
}