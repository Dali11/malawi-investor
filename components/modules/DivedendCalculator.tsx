'use client'
import { useState } from 'react'

export default function DividendCalculator() {
    const [shares, setShares] = useState(100)
    const [dividend, setDividend] = useState(2)

    return (
        <div className="bg-gray-50 rounded-xl p-5 my-6">
            <p className="text-xs text-gray-500 mb-3">Try it: dividend payout calculator</p>

            <div className="flex items-center gap-3 mb-3">
                <label className="text-sm text-gray-600 w-28">Shares owned</label>
                <input
                    type="range"
                    min={10}
                    max={500}
                    step={10}
                    value={shares}
                    onChange={e => setShares(Number(e.target.value))}
                    className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">{shares}</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <label className="text-sm text-gray-600 w-28">Dividend / share</label>
                <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={dividend}
                    onChange={e => setDividend(Number(e.target.value))}
                    className="flex-1"
                />
                <span className="text-sm font-medium w-16 text-right">MWK {dividend}</span>
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                <span className="text-sm text-gray-600">You earn</span>
                <span className="text-xl font-medium text-gray-900">
                    MWK {(shares * dividend).toLocaleString()}
                </span>
            </div>
        </div>
    )
}