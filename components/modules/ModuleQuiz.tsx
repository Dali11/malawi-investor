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
    // Most lessons still have a single quiz object in the database.
    // Lessons that want more than one question (like this one) just store
    // an array instead — both shapes work here without a migration.
    quiz: Quiz | Quiz[]
    onCorrect: () => void
    lang?: LearnLang
}) {
    const questions = Array.isArray(quiz) ? quiz : [quiz]
    const [step, setStep] = useState(0)
    const [selected, setSelected] = useState<number | null>(null)
    const [isCorrect, setIsCorrect] = useState(false)
    const t = learnDict[lang]

    const current = questions[step]
    const isLastQuestion = step === questions.length - 1

    function handleAnswer(index: number) {
        setSelected(index)
        const correct = index === current.correct_index
        setIsCorrect(correct)
        // Completion only unlocks once every question in the set has been
        // answered correctly, not just the first one.
        if (correct && isLastQuestion) onCorrect()
    }

    function handleNext() {
        setStep(s => s + 1)
        setSelected(null)
        setIsCorrect(false)
    }

    return (
        <div className="bg-(--color-background-secondary) rounded-xl p-5 my-6">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-(--color-text-secondary)">{t.quickCheck}</p>
                {questions.length > 1 && (
                    <p className="text-xs text-(--color-text-tertiary)">
                        {t.questionOf(step + 1, questions.length)}
                    </p>
                )}
            </div>
            <p className="text-sm font-medium text-(--color-text-primary) mb-3">{current.question}</p>
            <div className="flex flex-wrap gap-2">
                {current.options.map((option, index) => {
                    const isSelected = selected === index
                    const showCorrect = isSelected && index === current.correct_index
                    const showWrong = isSelected && index !== current.correct_index
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
                <div className="mt-3">
                    <p className={`text-xs ${isCorrect ? 'text-(--color-text-success)' : 'text-(--color-text-danger)'}`}>
                        {isCorrect ? (isLastQuestion ? t.correctAnswer : t.correctAnswerNext) : t.wrongAnswer}
                    </p>
                    {isCorrect && !isLastQuestion && (
                        <button
                            onClick={handleNext}
                            className="mt-2 text-sm px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                        >
                            {t.nextQuestion}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}