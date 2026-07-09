// components/watchlist/WatchlistButton.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function WatchlistButton({
    counterId,
    isLoggedIn,
    initialWatched,
    size = 18,
}: {
    counterId: number
    isLoggedIn: boolean
    initialWatched: boolean
    size?: number
}) {
    const router = useRouter()
    const supabase = createClient()
    const [watched, setWatched] = useState(initialWatched)
    const [pending, setPending] = useState(false)

    // Same class of bug as VoteButtons: if this component stays mounted
    // across a refresh (e.g. toggled from another tab), resync with
    // whatever the server now says instead of trusting a stale mount-time
    // snapshot.
    useEffect(() => {
        setWatched(initialWatched)
    }, [initialWatched])

    async function toggle(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        if (!isLoggedIn) {
            router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
            return
        }
        if (pending) return
        setPending(true)

        const next = !watched
        setWatched(next)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setPending(false)
            router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
            return
        }

        if (next) {
            await supabase.from('watchlist_items').insert({ user_id: user.id, counter_id: counterId })
        } else {
            await supabase.from('watchlist_items').delete()
                .eq('user_id', user.id).eq('counter_id', counterId)
        }

        setPending(false)
        router.refresh()
    }

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={pending}
            aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
            aria-pressed={watched}
            className="border-none bg-transparent p-1 disabled:opacity-60"
            style={{ color: watched ? 'var(--color-text-warning)' : 'var(--color-text-tertiary)' }}
        >
            <Star size={size} fill={watched ? 'currentColor' : 'none'} />
        </button>
    )
}