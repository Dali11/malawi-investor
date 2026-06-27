'use client'
import { useState } from 'react'

type Stock = {
    symbol: string
    price: number
    change: number
    volume: number
}

export default function TickerQuiz({
    stocks,
    onCorrect,
}: {
    stocks: Stock[] | null
    onCorrect: () => void
}) {
    const [selected, setSelected] = useState<string | null>(null)
    const [isCorrect, setIsCorrect] = useState(false)

    if (!stocks) {
        return (
            <div className="bg-gray-50 rounded-xl p-5 my-6">
                <p className="text-xs text-gray-500">Wait for the ticker above to freeze first.</p>
            </div>
        )
    }

    const biggestGainer = stocks.reduce((a, b) => (b.change > a.change ? b : a))

    function handleAnswer(symbol: string) {
        setSelected(symbol)
        const correct = symbol === biggestGainer.symbol
        setIsCorrect(correct)
        if (correct) onCorrect()
    }

    return (
        <div className="bg-gray-50 rounded-xl p-5 my-6">
            <p className="text-xs text-gray-500 mb-3">Quick check</p>
            <p className="text-sm font-medium text-gray-900 mb-3">
                Looking at the frozen ticker above, which symbol gained the most today?
            </p>
            <div className="flex flex-wrap gap-2">
                {stocks.map(s => {
                    const isSelected = selected === s.symbol
                    const showCorrect = isSelected && s.symbol === biggestGainer.symbol
                    const showWrong = isSelected && s.symbol !== biggestGainer.symbol
                    return (
                        <button
                            key={s.symbol}
                            onClick={() => handleAnswer(s.symbol)}
                            disabled={isCorrect}
                            className={`flex-1 min-w-[90px] text-sm py-2 rounded-lg border transition-colors ${showCorrect
                                    ? 'border-green-600 text-green-700 bg-green-50'
                                    : showWrong
                                        ? 'border-red-400 text-red-700 bg-red-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {s.symbol}
                        </button>
                    )
                })}
            </div>
            {selected !== null && (
                <p className={`text-xs mt-3 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {isCorrect
                        ? `Correct — ${biggestGainer.symbol} had the highest change today.`
                        : 'Not quite — look for the highest positive change percentage.'}
                </p>
            )}
        </div>
    )
}