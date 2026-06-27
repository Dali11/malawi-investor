'use client'
import { useState } from 'react'
import TickerDemo from './TickerDemo'
import TickerQuiz from './TickerQuiz'

type Stock = {
    symbol: string
    price: number
    change: number
    volume: number
}

export default function TickerModuleSection({ onCorrect }: { onCorrect: () => void }) {
    const [frozenStocks, setFrozenStocks] = useState<Stock[] | null>(null)

    return (
        <>
            <TickerDemo onFrozen={setFrozenStocks} />
            <TickerQuiz stocks={frozenStocks} onCorrect={onCorrect} />
        </>
    )
}