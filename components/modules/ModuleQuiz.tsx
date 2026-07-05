'use client'
import { useState } from 'react'

type Quiz = {
    question: string
    options: string[]
    correct_index: number
}

export default function ModuleQuiz({
    quiz,
    onCorrect,
}: {
    quiz: Quiz
    onCorrect: () => void
}) {
    const [selected, setSelected] = useState<number | null>(null)
    const [isCorrect, setIsCorrect] = useState(false)

    function handleAnswer(index: number) {
        setSelected(index)
        const correct = index === quiz.correct_index
        setIsCorrect(correct)
        if (correct) onCorrect()
    }

    return (
        <div className="bg-(--color-background-secondary) rounded-xl p-5 my-6">
            <p className="text-xs text-(--color-text-secondary) mb-3">Quick check</p>
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
                    {isCorrect
                        ? 'Correct — you can mark this module complete now.'
                        : 'Not quite — try another answer.'}
                </p>
            )}
        </div>
    )
}