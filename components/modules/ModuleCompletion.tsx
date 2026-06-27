'use client'
import { useState } from 'react'
import ModuleQuiz from './ModuleQuiz'

type Quiz = {
    question: string
    options: string[]
    correct_index: number
}

export default function ModuleCompletion({
    quiz,
    isCompleted,
    markComplete,
}: {
    quiz: Quiz | null
    isCompleted: boolean
    markComplete: () => Promise<void>
}) {
    const [unlocked, setUnlocked] = useState(isCompleted)

    return (
        <>
            {quiz && !isCompleted && (
                <ModuleQuiz quiz={quiz} onCorrect={() => setUnlocked(true)} />
            )}

            <form action={markComplete}>
                <button
                    type="submit"
                    disabled={isCompleted || (!!quiz && !unlocked)}
                    className={`w-full text-sm font-medium py-2 rounded-lg transition-colors disabled:cursor-not-allowed ${isCompleted
                            ? 'bg-green-600 text-white'
                            : unlocked || !quiz
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-gray-200 text-gray-400'
                        }`}
                >
                    {isCompleted ? '✓ Completed' : 'Mark as complete'}
                </button>
            </form>
        </>
    )
}