// lib/i18n/learn.ts
//
// Server-only helper for the /learn language toggle. The choice is stored
// in a plain cookie (not localStorage) because /learn pages are async
// server components that query Supabase directly — a cookie is readable
// during that server render, so there's no flash of the wrong language
// and no client round-trip needed to pick the right rows.

import { cookies } from 'next/headers'

export type { LearnLang, LearnDict } from './learn-dict'
export { learnDict, pickText } from './learn-dict'

export const LEARN_LANG_COOKIE = 'mi-learn-lang'

import type { LearnLang } from './learn-dict'

export async function getLearnLang(): Promise<LearnLang> {
    const cookieStore = await cookies()
    const value = cookieStore.get(LEARN_LANG_COOKIE)?.value
    return value === 'ny' ? 'ny' : 'en'
}