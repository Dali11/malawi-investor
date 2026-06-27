'use client'
import { useState } from 'react'
import ModuleQuiz from './ModuleQuiz'
import { widgetRegistry } from './widgetRegistry'

type Quiz = {
    question: string
    options: string[]
    correct_index: number
}

export default function ModuleCompletion({
    quiz,
    widgetType,
    isCompleted,
    markComplete,
}: {
    quiz?: Quiz | null
    widgetType?: string | null
    isCompleted: boolean
    markComplete: () => Promise<void>
}) {
    const [unlocked, setUnlocked] = useState(isCompleted)

    const widget = widgetType ? widgetRegistry[widgetType] : null
    const widgetGates = widget?.gatesCompletion ?? false
    const hasGate = !!quiz || widgetGates

    return (
        <>
            {!isCompleted && quiz && (
                <ModuleQuiz quiz={quiz} onCorrect={() => setUnlocked(true)} />
            )}
            {!isCompleted && widget && widgetGates && widget.render({ onCorrect: () => setUnlocked(true) })}

            <form action={markComplete}>
                <button
                    type="submit"
                    disabled={isCompleted || (hasGate && !unlocked)}
                    className={`w-full text-sm font-medium py-2 rounded-lg transition-colors disabled:cursor-not-allowed ${isCompleted
                            ? 'bg-green-600 text-white'
                            : unlocked || !hasGate
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