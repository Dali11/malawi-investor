'use client'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import type { LearnLang } from '@/lib/i18n/learn-dict'
import { LEARN_LANG_COOKIE } from '@/lib/i18n/learn'

/**
 * Switches the /learn section between English and Chichewa.
 *
 * The pages under /learn are server components that read the current
 * language from a cookie and query Supabase accordingly, so switching
 * languages here just sets the cookie and asks the router to re-fetch
 * the current page from the server — no client-side data fetching needed.
 */
export default function LanguageToggle({ lang }: { lang: LearnLang }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    function setLang(next: LearnLang) {
        if (next === lang) return
        document.cookie = `${LEARN_LANG_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`
        startTransition(() => {
            router.refresh()
        })
    }

    return (
        <div
            className="inline-flex flex-shrink-0 rounded-lg border border-(--color-border-tertiary) p-0.5 text-xs font-medium"
            role="group"
            aria-label="Choose language / Sankhani chiyankhulo"
        >
            <button
                type="button"
                onClick={() => setLang('en')}
                disabled={isPending}
                aria-pressed={lang === 'en'}
                className={`px-2.5 py-1 rounded-md transition-colors disabled:opacity-60 ${lang === 'en'
                    ? 'bg-amber-600 text-white'
                    : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
                    }`}
            >
                EN
            </button>
            <button
                type="button"
                onClick={() => setLang('ny')}
                disabled={isPending}
                aria-pressed={lang === 'ny'}
                className={`px-2.5 py-1 rounded-md transition-colors disabled:opacity-60 ${lang === 'ny'
                    ? 'bg-amber-600 text-white'
                    : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
                    }`}
            >
                Chichewa
            </button>
        </div>
    )
}