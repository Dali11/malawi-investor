// lib/i18n/learn-dict.ts
//
// UI-chrome strings for the /learn section, in English and Chichewa.
// This file is intentionally free of any server-only imports (no
// `next/headers`) so it can be imported from both server and client
// components — e.g. ModuleQuiz.tsx needs these strings client-side.
//
// This does NOT hold lesson content (titles/descriptions/article body/
// quizzes) — that lives in Supabase in the `_ny` columns. This dictionary
// is only for the surrounding page chrome: buttons, labels, empty states.

export type LearnLang = 'en' | 'ny'

export type LearnDict = {
    eyebrow: string
    learnTheMse: string
    lessonsCompleted: (done: number, total: number) => string
    done: string
    backToAllLessons: string
    lessonOf: (chapter: string, i: number, total: number) => string
    moduleOf: (i: number, total: number) => string
    contentComingSoon: string
    markComplete: string
    completed: string
    quickCheck: string
    correctAnswer: string
    wrongAnswer: string
    notTranslatedNotice: string
    tabsPortfolio: [string, string, string]
    tabsFinancials: [string, string, string]
    tabsOrder: [string, string, string]
}

const en: LearnDict = {
    eyebrow: 'Malawi Investor',
    learnTheMse: 'Learn the MSE',
    lessonsCompleted: (done, total) => `${done} of ${total} lessons completed`,
    done: 'Done',
    backToAllLessons: '← Back to all lessons',
    lessonOf: (chapter, i, total) => `${chapter} · Lesson ${i} of ${total}`,
    moduleOf: (i, total) => `Module ${i} of ${total}`,
    contentComingSoon: 'Lesson content coming soon.',
    markComplete: 'Mark as complete',
    completed: '✓ Completed',
    quickCheck: 'Quick check',
    correctAnswer: 'Correct — you can mark this module complete now.',
    wrongAnswer: 'Not quite — try another answer.',
    notTranslatedNotice: "This lesson isn't translated into Chichewa yet — showing the English version below.",
    tabsPortfolio: ['1. The idea', '2. Try it', '3. How much is enough'],
    tabsFinancials: ['1. Read a statement', '2. Compare two companies', '3. Red flags'],
    tabsOrder: ['1. The basics', '2. Try it', '3. After you click buy'],
}

const ny: LearnDict = {
    eyebrow: 'Malawi Investor',
    learnTheMse: 'Phunzirani za MSE',
    lessonsCompleted: (done, total) => `Mwamaliza maphunziro ${done} pa ${total}`,
    done: 'Yamalizidwa',
    backToAllLessons: '← Bwererani ku maphunziro onse',
    lessonOf: (chapter, i, total) => `${chapter} · Phunziro ${i} la ${total}`,
    moduleOf: (i, total) => `Gawo ${i} la ${total}`,
    contentComingSoon: 'Nkhani ya phunziroli ikubwera posachedwa.',
    markComplete: 'Onetsani kuti mwamaliza',
    completed: '✓ Yamalizidwa',
    quickCheck: 'Yesetsani kudziwa',
    correctAnswer: 'Zolondola — mutha kuonetsa kuti mwamaliza gawoli tsopano.',
    wrongAnswer: 'Ayi, si zimenezo — yesaninso.',
    notTranslatedNotice: 'Phunziroli silinamasuliridwe mu Chichewa pakadali pano — tikuonetsani mu Chingerezi pansipa.',
    tabsPortfolio: ['1. Lingaliro', '2. Yesani nokha', '3. Kuchuluka kokwanira'],
    tabsFinancials: ['1. Werengani chiwerengero', '2. Yerekezerani makampani awiri', '3. Zizindikiro zoyipa'],
    tabsOrder: ['1. Zoyambira', '2. Yesani nokha', '3. Mutatha kudina "buy"'],
}

export const learnDict: Record<LearnLang, LearnDict> = { en, ny }

/** Picks a translated field, falling back to English when the ny value is missing/blank. */
export function pickText(enValue: string, nyValue: string | null | undefined, lang: LearnLang): string {
    if (lang === 'ny' && nyValue && nyValue.trim().length > 0) return nyValue
    return enValue
}