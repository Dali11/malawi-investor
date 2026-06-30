'use client'
import { useState } from 'react'

const stockNames = ['NITL', 'NICO', 'FDHB', 'NBM', 'AIRTEL', 'TNM']

function randomReturn() {
    return Math.round((Math.random() * 140 - 20) * 10) / 10
}

export default function PortfolioSimulator() {
    const [mode, setMode] = useState<'concentrated' | 'diversified' | null>(null)
    const [results, setResults] = useState<number[] | null>(null)

    function runSimulation(selectedMode: 'concentrated' | 'diversified') {
        setMode(selectedMode)
        const holdings = selectedMode === 'concentrated' ? 1 : 5
        const returns = Array.from({ length: holdings }, randomReturn)
        setResults(returns)
    }

    const average = results ? results.reduce((a, b) => a + b, 0) / results.length : 0
    const spread = results && results.length > 1 ? Math.max(...results) - Math.min(...results) : 0

    return (
        <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-3">
                Try it: simulate a quarter with one stock vs. five stocks
            </p>

            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => runSimulation('concentrated')}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 rounded-lg"
                >
                    All in one stock
                </button>
                <button
                    onClick={() => runSimulation('diversified')}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 rounded-lg"
                >
                    Spread across 5
                </button>
            </div>

            {results && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">
                        {mode === 'concentrated'
                            ? stockNames[0]
                            : `${results.length} stocks: ${stockNames.slice(0, results.length).join(', ')}`}
                    </p>
                    <div className="space-y-1 mb-3">
                        {results.map((r, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                    {mode === 'concentrated' ? stockNames[0] : stockNames[i]}
                                </span>
                                <span className={r >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    {r >= 0 ? '+' : ''}
                                    {r}%
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                        <span className="text-gray-600">Portfolio average</span>
                        <span className="font-medium">
                            {average >= 0 ? '+' : ''}
                            {average.toFixed(1)}%
                        </span>
                    </div>
                    {results.length > 1 && (
                        <p className="text-xs text-gray-500 mt-2">
                            Spread between best and worst: {spread.toFixed(1)} points — notice how the average smooths out the extremes.
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}