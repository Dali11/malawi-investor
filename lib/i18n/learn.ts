// lib/i18n/learn.ts
//
// Server-only helper for the /learn language toggle. The choice is stored
// in a plain cookie (not localStorage) because /learn pages are async
// server components that query Supabase directly — a cookie is readable
// during that server render, so there's no flash of the wrong language
// and no client round-trip needed to pick the right rows.
//
// This file imports `next/headers`, so it must never be imported from a
// client component (e.g. LanguageToggle.tsx) — those import the cookie
// name and types straight from './learn-dict' instead.

import { cookies } from 'next/headers'
import { LEARN_LANG_COOKIE, learnDict, pickText } from './learn-dict'
import type { LearnLang, LearnDict } from './learn-dict'

export type { LearnLang, LearnDict }
export { learnDict, pickText, LEARN_LANG_COOKIE }

export async function getLearnLang(): Promise<LearnLang> {
    const cookieStore = await cookies()
    const value = cookieStore.get(LEARN_LANG_COOKIE)?.value
    return value === 'ny' ? 'ny' : 'en'
}