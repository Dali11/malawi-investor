'use client'
import { useState, useEffect, useRef } from 'react'
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react'

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
    const calledRef = useRef(false)

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

        const freezeTimer = setTimeout(() => {
            clearInterval(interval)
            setFrozen(true)
        }, 8000)

        return () => {
            clearInterval(interval)
            clearTimeout(freezeTimer)
        }
    }, [frozen])

    useEffect(() => {
        if (frozen && !calledRef.current && onFrozen) {
            calledRef.current = true
            onFrozen(stocks)
        }
    }, [frozen, stocks, onFrozen])

    return (
        <div className="bg-gray-50 rounded-xl p-5 my-6">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">Watch the ticker move</p>
                {frozen && <p className="text-xs text-amber-600 font-medium">Frozen — check the question below</p>}
            </div>
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
                                    {isUp && <IconArrowUpRight size={14} className="inline mr-0.5" />}
                                    {isDown && <IconArrowDownRight size={14} className="inline mr-0.5" />}
                                    {s.change.toFixed(2)}%
                                </td>
                                <td className="py-2 text-right text-gray-500">{s.volume.toLocaleString()}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}