// components/community/ThreadList.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronUp, ChevronDown, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CommunityThreadRow } from '@/types/community'

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    'General Discussion': { bg: 'var(--color-background-tertiary)', text: 'var(--color-text-secondary)' },
    'Beginner Questions': { bg: 'var(--color-background-success)', text: 'var(--color-text-success)' },
    'Market News': { bg: 'var(--color-background-info)', text: 'var(--color-text-info)' },
    'Dividends & IPOs': { bg: 'var(--color-background-warning)', text: 'var(--color-text-warning)' },
    'Off-topic': { bg: 'var(--color-background-tertiary)', text: 'var(--color-text-secondary)' },
}

function timeAgo(iso: string) {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return new Date(iso).toLocaleDateString('en-MW', { day: 'numeric', month: 'short' })
}

function VoteButtons({
    threadId,
    upvotes,
    downvotes,
    myVote,
    isLoggedIn,
}: {
    threadId: string
    upvotes: number
    downvotes: number
    myVote: 1 | -1 | null
    isLoggedIn: boolean
}) {
    const router = useRouter()
    const supabase = createClient()
    const [pending, setPending] = useState(false)
    const [optimistic, setOptimistic] = useState({ upvotes, downvotes, myVote })

    async function vote(value: 1 | -1, e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        if (!isLoggedIn) {
            router.push(`/login?redirect=${encodeURIComponent('/community')}`)
            return
        }
        if (pending) return
        setPending(true)

        const prev = optimistic
        const clearing = prev.myVote === value

        // Optimistic update
        setOptimistic((s) => {
            let up = s.upvotes
            let down = s.downvotes
            if (s.myVote === 1) up -= 1
            if (s.myVote === -1) down -= 1
            if (!clearing) {
                if (value === 1) up += 1
                if (value === -1) down += 1
            }
            return { upvotes: up, downvotes: down, myVote: clearing ? null : value }
        })

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setPending(false); router.push('/login?redirect=/community'); return }

        if (clearing) {
            await supabase.from('community_votes').delete()
                .eq('user_id', user.id).eq('target_type', 'thread').eq('target_id', threadId)
        } else {
            await supabase.from('community_votes').upsert(
                { user_id: user.id, target_type: 'thread', target_id: threadId, value },
                { onConflict: 'user_id,target_type,target_id' },
            )
        }

        setPending(false)
        router.refresh()
    }

    const score = optimistic.upvotes - optimistic.downvotes

    return (
        <div className="flex flex-col items-center gap-0.5 pt-0.5" style={{ minWidth: 32 }}>
            <button
                type="button"
                onClick={(e) => vote(1, e)}
                aria-label="Upvote"
                disabled={pending}
                className="border-none p-0.5"
                style={{ color: optimistic.myVote === 1 ? 'var(--color-text-warning)' : 'var(--color-text-tertiary)' }}
            >
                <ChevronUp size={18} />
            </button>
            <span className="text-[13px] font-medium text-(--color-text-primary) font-(family-name:--font-mono)">
                {score}
            </span>
            <button
                type="button"
                onClick={(e) => vote(-1, e)}
                aria-label="Downvote"
                disabled={pending}
                className="border-none p-0.5"
                style={{ color: optimistic.myVote === -1 ? 'var(--color-text-danger)' : 'var(--color-text-tertiary)' }}
            >
                <ChevronDown size={18} />
            </button>
        </div>
    )
}

export function ThreadList({ threads, isLoggedIn }: { threads: CommunityThreadRow[]; isLoggedIn: boolean }) {
    if (threads.length === 0) {
        return (
            <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) px-4 py-10 text-center shadow-(--shadow-card)">
                <p className="text-[13px] text-(--color-text-tertiary)">No threads here yet — be the first to start one.</p>
            </div>
        )
    }

    return (
        <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
            {threads.map((t, i) => {
                const colors = CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS['General Discussion']
                const snippet = t.body.length > 160 ? `${t.body.slice(0, 160)}…` : t.body
                return (
                    <div
                        key={t.id}
                        className={`flex gap-3.5 px-4 py-3.5 ${i < threads.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                    >
                        <VoteButtons
                            threadId={t.id}
                            upvotes={t.upvotes}
                            downvotes={t.downvotes}
                            myVote={t.my_vote}
                            isLoggedIn={isLoggedIn}
                        />
                        <Link
                            href={`/community/${t.id}`}
                            className="min-w-0 flex-1 no-underline"
                        >
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span
                                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                                    style={{ background: colors.bg, color: colors.text }}
                                >
                                    {t.category}
                                </span>
                                <span className="text-[11px] text-(--color-text-tertiary)">
                                    {t.author_name} · {timeAgo(t.created_at)}
                                </span>
                            </div>
                            <p className="text-[14px] font-medium text-(--color-text-primary) leading-snug">{t.title}</p>
                            {snippet && (
                                <p className="mt-1 line-clamp-2 sm:line-clamp-1 text-[12px] text-(--color-text-secondary) leading-snug">
                                    {snippet}
                                </p>
                            )}
                        </Link>
                        <div className="flex shrink-0 items-center gap-1 self-start pt-0.5 text-[12px] text-(--color-text-tertiary)">
                            <MessageCircle size={14} aria-hidden="true" />
                            {t.reply_count}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}