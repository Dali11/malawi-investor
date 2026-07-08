'use client'
import { useState } from 'react'
import TickerDemo, { type FrozenStock } from './TickerDemo'
import TickerQuiz from './TickerQuiz'
import type { LearnLang } from '@/lib/i18n/learn-dict'

export default function TickerModuleSection({ onCorrect, lang = 'en' }: { onCorrect: () => void; lang?: LearnLang }) {
    const [frozenStock, setFrozenStock] = useState<FrozenStock | null>(null)

    return (
        <>
            <TickerDemo lang={lang} onFrozen={setFrozenStock} />
            <TickerQuiz stock={frozenStock} lang={lang} onCorrect={onCorrect} />
        </>
    )
}