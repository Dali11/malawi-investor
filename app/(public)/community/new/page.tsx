'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { COMMUNITY_CATEGORIES } from '@/types/community'

export default function NewThreadPage() {
    const router = useRouter()
    const supabase = createClient()

    const [checkingAuth, setCheckingAuth] = useState(true)
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState<string>(COMMUNITY_CATEGORIES[0])
    const [body, setBody] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                router.replace('/login?redirect=/community/new')
                return
            }
            setCheckingAuth(false)
        })
    }, [router, supabase])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (title.trim().length < 6) {
            setError('Title needs to be at least 6 characters.')
            return
        }
        if (body.trim().length < 10) {
            setError('Give a bit more detail in the body — at least 10 characters.')
            return
        }

        setSubmitting(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.replace('/login?redirect=/community/new')
            return
        }

        const { data, error: insertError } = await supabase
            .from('community_threads')
            .insert({ user_id: user.id, title: title.trim(), body: body.trim(), category })
            .select('id')
            .single()

        setSubmitting(false)
        if (insertError || !data) {
            setError(insertError?.message ?? 'Something went wrong posting this — try again.')
            return
        }

        router.push(`/community/${data.id}`)
    }

    if (checkingAuth) return null

    return (
        <div className="mx-auto max-w-xl space-y-5">
            <Link
                href="/community"
                className="inline-flex items-center gap-1.5 text-[13px] text-(--color-text-tertiary) no-underline hover:text-(--color-text-primary)"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                Back to Community
            </Link>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="category" className="mb-1.5 block text-[13px] font-medium text-(--color-text-secondary)">
                        Category
                    </label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-3 py-2 text-[14px] text-(--color-text-primary)"
                    >
                        {COMMUNITY_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="title" className="mb-1.5 block text-[13px] font-medium text-(--color-text-secondary)">
                        Title
                    </label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What's the discussion about?"
                        className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-3 py-2 text-[14px] text-(--color-text-primary)"
                        maxLength={150}
                    />
                </div>

                <div>
                    <label htmlFor="body" className="mb-1.5 block text-[13px] font-medium text-(--color-text-secondary)">
                        Body
                    </label>
                    <textarea
                        id="body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Share the details..."
                        rows={8}
                        className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-3 py-2 text-[14px] text-(--color-text-primary)"
                    />
                </div>

                {error && <p className="text-[13px] text-(--color-text-danger)">{error}</p>}

                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-(--border-radius-md) bg-(--color-text-primary) px-4 py-2 text-[13px] font-medium text-(--color-background-primary) disabled:opacity-50"
                >
                    {submitting ? 'Posting…' : 'Post thread'}
                </button>
            </form>
        </div>
    )
}