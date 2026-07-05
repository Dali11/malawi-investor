'use client'
import { useState } from 'react'
import { learnDict, type LearnLang } from '@/lib/i18n/learn-dict'

type Quiz = {
    question: string
    options: string[]
    correct_index: number
}

export default function ModuleQuiz({
    quiz,
    onCorrect,
    lang = 'en',
}: {
    quiz: Quiz
    onCorrect: () => void
    lang?: LearnLang
}) {
    const [selected, setSelected] = useState<number | null>(null)
    const [isCorrect, setIsCorrect] = useState(false)
    const t = learnDict[lang]

    function handleAnswer(index: number) {
        setSelected(index)
        const correct = index === quiz.correct_index
        setIsCorrect(correct)
        if (correct) onCorrect()
    }

    return (
        <div className="bg-(--color-background-secondary) rounded-xl p-5 my-6">
            <p className="text-xs text-(--color-text-secondary) mb-3">{t.quickCheck}</p>
            <p className="text-sm font-medium text-(--color-text-primary) mb-3">{quiz.question}</p>
            <div className="flex flex-wrap gap-2">
                {quiz.options.map((option, index) => {
                    const isSelected = selected === index
                    const showCorrect = isSelected && index === quiz.correct_index
                    const showWrong = isSelected && index !== quiz.correct_index
                    return (
                        <button
                            key={index}
                            onClick={() => handleAnswer(index)}
                            disabled={isCorrect}
                            className={`flex-1 min-w-[100px] text-sm py-2 rounded-lg border transition-colors text-(--color-text-primary) ${showCorrect
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
                    {isCorrect ? t.correctAnswer : t.wrongAnswer}
                </p>
            )}
        </div>
    )
}