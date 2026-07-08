// components/community/VoteButtons.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function VoteButtons({
    targetType,
    targetId,
    upvotes,
    downvotes,
    myVote,
    isLoggedIn,
    layout = 'vertical',
}: {
    targetType: 'thread' | 'reply'
    targetId: string
    upvotes: number
    downvotes: number
    myVote: 1 | -1 | null
    isLoggedIn: boolean
    layout?: 'vertical' | 'pill'
}) {
    const router = useRouter()
    const supabase = createClient()
    const [pending, setPending] = useState(false)
    const [optimistic, setOptimistic] = useState({ upvotes, downvotes, myVote })

    // Keep the local optimistic snapshot in sync with fresh server data
    // (e.g. after a realtime-triggered router.refresh() from someone
    // else's vote). Without this, an already-mounted VoteButtons never
    // picks up changes made anywhere but its own click handler — new
    // props alone don't reset useState after the first render.
    useEffect(() => {
        setOptimistic({ upvotes, downvotes, myVote })
    }, [upvotes, downvotes, myVote])

    async function vote(value: 1 | -1, e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        if (!isLoggedIn) {
            router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
            return
        }
        if (pending) return
        setPending(true)

        const prev = optimistic
        const clearing = prev.myVote === value

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
        if (!user) {
            setPending(false)
            router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
            return
        }

        if (clearing) {
            await supabase.from('community_votes').delete()
                .eq('user_id', user.id).eq('target_type', targetType).eq('target_id', targetId)
        } else {
            await supabase.from('community_votes').upsert(
                { user_id: user.id, target_type: targetType, target_id: targetId, value },
                { onConflict: 'user_id,target_type,target_id' },
            )
        }

        setPending(false)
        router.refresh()
    }

    const score = optimistic.upvotes - optimistic.downvotes

    if (layout === 'pill') {
        return (
            <div
                className="flex items-center gap-1 rounded-full px-2 py-1"
                style={{ background: 'var(--color-background-secondary)' }}
            >
                <button
                    type="button"
                    onClick={(e) => vote(1, e)}
                    aria-label="Upvote"
                    disabled={pending}
                    className="border-none bg-transparent p-0"
                    style={{ color: optimistic.myVote === 1 ? 'var(--color-text-warning)' : 'var(--color-text-tertiary)' }}
                >
                    <ChevronUp size={15} />
                </button>
                <span className="min-w-[1ch] text-center text-[12px] font-semibold text-(--color-text-primary) font-(family-name:--font-mono)">
                    {score}
                </span>
                <button
                    type="button"
                    onClick={(e) => vote(-1, e)}
                    aria-label="Downvote"
                    disabled={pending}
                    className="border-none bg-transparent p-0"
                    style={{ color: optimistic.myVote === -1 ? 'var(--color-text-danger)' : 'var(--color-text-tertiary)' }}
                >
                    <ChevronDown size={15} />
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-0.5 pt-0.5" style={{ minWidth: 28 }}>
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