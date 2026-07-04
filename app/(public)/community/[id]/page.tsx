// app/(public)/community/[id]/page.tsx
// Thread detail: original post + nested (Reddit-style) replies. Public
// read, same as the list — see ThreadDetail for the gated reply/vote/
// report actions.

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CommunityReplyRow, CommunityThreadRow } from '@/types/community'
import { ThreadDetail } from '@/components/community/ThreadDetail'

export const revalidate = 0

export default async function ThreadDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const { data: thread } = await supabase
        .from('community_threads')
        .select('id, title, body, category, upvotes, downvotes, reply_count, created_at, last_activity_at, user_id')
        .eq('id', id)
        .eq('status', 'visible')
        .maybeSingle()

    if (!thread) notFound()

    const { data: rawReplies } = await supabase
        .from('community_replies')
        .select('id, thread_id, parent_reply_id, body, upvotes, downvotes, created_at, user_id')
        .eq('thread_id', id)
        .eq('status', 'visible')
        .order('created_at', { ascending: true })

    const replies = rawReplies ?? []

    // Author names for the thread + every reply — see the list page for
    // why this is a separate query rather than a PostgREST embed.
    const userIds = [...new Set([thread.user_id, ...replies.map((r) => r.user_id)])]
    const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
        : { data: [] as { id: string; full_name: string | null }[] }
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name || 'Investor']))

    // Current user's votes on the thread itself and every reply shown.
    let voteByTargetId = new Map<string, 1 | -1>()
    if (user) {
        const targetIds = [thread.id, ...replies.map((r) => r.id)]
        const { data: votes } = await supabase
            .from('community_votes')
            .select('target_id, value')
            .eq('user_id', user.id)
            .in('target_id', targetIds)
        voteByTargetId = new Map((votes ?? []).map((v) => [v.target_id, v.value as 1 | -1]))
    }

    const threadRow: CommunityThreadRow = {
        ...thread,
        author_name: nameById.get(thread.user_id) ?? 'Investor',
        my_vote: voteByTargetId.get(thread.id) ?? null,
    }

    const replyRows: CommunityReplyRow[] = replies.map((r) => ({
        ...r,
        author_name: nameById.get(r.user_id) ?? 'Investor',
        my_vote: voteByTargetId.get(r.id) ?? null,
    }))

    return <ThreadDetail thread={threadRow} replies={replyRows} isLoggedIn={!!user} />
}