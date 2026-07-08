'use client'
import { useState, useMemo } from 'react'
import type { LearnLang } from '@/lib/i18n/learn-dict'
import type { FrozenStock } from './TickerDemo'

const copy = {
    en: {
        waiting: 'Pause the ticker above first, then answer using the frozen values.',
        quickCheck: 'Quick check',
        question: "Using the frozen price above, roughly what is NBM's market cap?",
        correct: 'Correct, price times shares outstanding.',
        wrong: 'Not quite, market cap is price times total shares outstanding.',
    },
    ny: {
        waiting: 'Imitsani ma tikala pamwambapa choyamba, kenako yankhani pogwiritsa ntchito ziwerengero zoimitsidwa.',
        quickCheck: 'Funso laling\'ono',
        question: "Pogwiritsa ntchito mtengo womwe waimitsidwa pamwambapa, kodi mtengo wonse wa kampani ya NBM ndi wotani?",
        correct: 'Molondola, mtengo wa share kuchulukitsidwa ndi ma-share onse.',
        wrong: 'Osati bwinobwino, mtengo wonse wa kampani ndi mtengo wa share kuchulukitsidwa ndi ma-share onse.',
    },
} as const

export default function TickerQuiz({
    stock,
    lang = 'en',
    onCorrect,
}: {
    stock: FrozenStock | null
    lang?: LearnLang
    onCorrect: () => void
}) {
    const t = copy[lang]
    const [selected, setSelected] = useState<string | null>(null)
    const [isCorrect, setIsCorrect] = useState(false)

    const options = useMemo(() => {
        if (!stock) return []
        const cap = stock.price * stock.sharesOutstanding
        const correct = 'MK' + (cap / 1e9).toFixed(1) + 'B'
        const wrong1 = 'MK' + ((cap * 1.4) / 1e9).toFixed(1) + 'B'
        const wrong2 = 'MK' + (stock.price / 1e6).toFixed(1) + 'B'
        return [correct, wrong1, wrong2].sort(() => Math.random() - 0.5)
    }, [stock])

    const correctAnswer = useMemo(() => {
        if (!stock) return null
        const cap = stock.price * stock.sharesOutstanding
        return 'MK' + (cap / 1e9).toFixed(1) + 'B'
    }, [stock])

    if (!stock) {
        return (
            <div className="rounded-xl border border-(--color-border-tertiary) bg-(--color-background-secondary) p-5 my-6">
                <p className="text-xs text-(--color-text-secondary)">{t.waiting}</p>
            </div>
        )
    }

    function handleAnswer(option: string) {
        setSelected(option)
        const correct = option === correctAnswer
        setIsCorrect(correct)
        if (correct) onCorrect()
    }

    return (
        <div className="rounded-xl border border-(--color-border-tertiary) bg-(--color-background-secondary) p-5 my-6">
            <p className="text-xs text-(--color-text-secondary) mb-3">{t.quickCheck}</p>
            <p className="text-sm font-medium text-(--color-text-primary) mb-3">{t.question}</p>
            <div className="flex flex-wrap gap-2">
                {options.map(option => {
                    const isSelected = selected === option
                    const showCorrect = isSelected && option === correctAnswer
                    const showWrong = isSelected && option !== correctAnswer
                    return (
                        <button
                            key={option}
                            onClick={() => handleAnswer(option)}
                            disabled={isCorrect}
                            className={`flex-1 min-w-[90px] text-sm py-2 rounded-lg border transition-colors text-(--color-text-primary) ${showCorrect
                                ? 'border-(--color-text-success) text-(--color-text-success) bg-(--color-background-success)'
                                : showWrong
                                    ? 'border-(--color-text-danger) text-(--color-text-danger) bg-(--color-background-danger)'
                                    : 'border-(--color-border-tertiary) hover:border-(--color-border-secondary)'
                                }`}
                        >
                            {option}
                        </button>
                    )
                })}
            </div>
            {selected !== null && (
                <p className={`text-xs mt-3 ${isCorrect ? 'text-(--color-text-success)' : 'text-(--color-text-danger)'}`}>
                    {isCorrect ? t.correct : t.wrong}
                </p>
            )}
        </div>
    )
}