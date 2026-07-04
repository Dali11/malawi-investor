// components/community/ThreadDetail.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle, Flag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { VoteButtons } from '@/components/community/VoteButtons'
import { CATEGORY_COLORS, type CommunityReplyRow, type CommunityThreadRow } from '@/types/community'
import { timeAgo } from '@/lib/timeAgo'

const MAX_INDENT_DEPTH = 6

function requireLogin(router: ReturnType<typeof useRouter>, path: string) {
    router.push(`/login?redirect=${encodeURIComponent(path)}`)
}

async function fileReport(
    supabase: ReturnType<typeof createClient>,
    router: ReturnType<typeof useRouter>,
    isLoggedIn: boolean,
    path: string,
    targetType: 'thread' | 'reply',
    targetId: string,
) {
    if (!isLoggedIn) { requireLogin(router, path); return }
    const reason = window.prompt('What\'s wrong with this post? (optional)') ?? ''
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { requireLogin(router, path); return }
    await supabase.from('community_reports').insert({
        target_type: targetType,
        target_id: targetId,
        reporter_id: user.id,
        reason: reason.trim() || null,
    })
    window.alert('Thanks — this has been reported for review.')
}

function ReplyComposer({
    isLoggedIn,
    placeholder,
    onSubmit,
    onCancel,
}: {
    isLoggedIn: boolean
    placeholder: string
    onSubmit: (body: string) => Promise<void>
    onCancel?: () => void
}) {
    const router = useRouter()
    const [body, setBody] = useState('')
    const [submitting, setSubmitting] = useState(false)

    if (!isLoggedIn) {
        return (
            <button
                type="button"
                onClick={() => requireLogin(router, window.location.pathname)}
                className="rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) px-3 py-2 text-[13px] text-(--color-text-secondary) hover:text-(--color-text-primary)"
            >
                Sign in to reply
            </button>
        )
    }

    return (
        <div className="space-y-2">
            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-3 py-2 text-[13px] text-(--color-text-primary)"
            />
            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={submitting || body.trim().length < 2}
                    onClick={async () => {
                        setSubmitting(true)
                        await onSubmit(body.trim())
                        setSubmitting(false)
                        setBody('')
                    }}
                    className="rounded-(--border-radius-md) bg-(--color-text-primary) px-3.5 py-1.5 text-[12px] font-medium text-(--color-background-primary) disabled:opacity-50"
                >
                    {submitting ? 'Posting…' : 'Post reply'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) px-3.5 py-1.5 text-[12px] text-(--color-text-secondary)"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    )
}

function ReplyNode({
    reply,
    childrenByParent,
    threadId,
    isLoggedIn,
    depth,
}: {
    reply: CommunityReplyRow
    childrenByParent: Map<string | null, CommunityReplyRow[]>
    threadId: string
    isLoggedIn: boolean
    depth: number
}) {
    const router = useRouter()
    const supabase = createClient()
    const [replying, setReplying] = useState(false)
    const children = childrenByParent.get(reply.id) ?? []
    const indent = Math.min(depth, MAX_INDENT_DEPTH) * 20

    async function postReply(body: string) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { requireLogin(router, window.location.pathname); return }
        await supabase.from('community_replies').insert({
            thread_id: threadId,
            parent_reply_id: reply.id,
            user_id: user.id,
            body,
        })
        setReplying(false)
        router.refresh()
    }

    return (
        <div style={{ marginLeft: indent }} className="pt-3">
            <div className="flex gap-3">
                <VoteButtons
                    targetType="reply"
                    targetId={reply.id}
                    upvotes={reply.upvotes}
                    downvotes={reply.downvotes}
                    myVote={reply.my_vote}
                    isLoggedIn={isLoggedIn}
                />
                <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-(--color-text-primary)">
                        {reply.author_name} <span className="font-normal text-(--color-text-tertiary)">· {timeAgo(reply.created_at)}</span>
                    </p>
                    <p className="mt-0.5 text-[13px] text-(--color-text-secondary) leading-relaxed whitespace-pre-wrap">{reply.body}</p>
                    <div className="mt-1.5 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => (isLoggedIn ? setReplying((r) => !r) : requireLogin(router, window.location.pathname))}
                            className="border-none p-0 text-[11px] font-medium text-(--color-text-tertiary) hover:text-(--color-text-primary)"
                        >
                            Reply
                        </button>
                        <button
                            type="button"
                            onClick={() => fileReport(supabase, router, isLoggedIn, window.location.pathname, 'reply', reply.id)}
                            className="flex items-center gap-1 border-none p-0 text-[11px] text-(--color-text-tertiary) hover:text-(--color-text-primary)"
                        >
                            <Flag size={11} aria-hidden="true" /> Report
                        </button>
                    </div>
                    {replying && (
                        <div className="mt-2">
                            <ReplyComposer
                                isLoggedIn={isLoggedIn}
                                placeholder={`Reply to ${reply.author_name}...`}
                                onSubmit={postReply}
                                onCancel={() => setReplying(false)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {children.map((child) => (
                <ReplyNode
                    key={child.id}
                    reply={child}
                    childrenByParent={childrenByParent}
                    threadId={threadId}
                    isLoggedIn={isLoggedIn}
                    depth={depth + 1}
                />
            ))}
        </div>
    )
}

export function ThreadDetail({
    thread,
    replies,
    isLoggedIn,
}: {
    thread: CommunityThreadRow
    replies: CommunityReplyRow[]
    isLoggedIn: boolean
}) {
    const router = useRouter()
    const supabase = createClient()
    const colors = CATEGORY_COLORS[thread.category] ?? CATEGORY_COLORS['General Discussion']

    const childrenByParent = new Map<string | null, CommunityReplyRow[]>()
    for (const r of replies) {
        const key = r.parent_reply_id
        if (!childrenByParent.has(key)) childrenByParent.set(key, [])
        childrenByParent.get(key)!.push(r)
    }
    const topLevel = childrenByParent.get(null) ?? []

    async function postTopLevelReply(body: string) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { requireLogin(router, window.location.pathname); return }
        await supabase.from('community_replies').insert({
            thread_id: thread.id,
            parent_reply_id: null,
            user_id: user.id,
            body,
        })
        router.refresh()
    }

    return (
        <div className="mx-auto max-w-2xl space-y-5">
            <Link
                href="/community"
                className="inline-flex items-center gap-1.5 text-[13px] text-(--color-text-tertiary) no-underline hover:text-(--color-text-primary)"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                All threads
            </Link>

            <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-4 shadow-(--shadow-card) sm:p-5">
                <div className="flex gap-3.5">
                    <VoteButtons
                        targetType="thread"
                        targetId={thread.id}
                        upvotes={thread.upvotes}
                        downvotes={thread.downvotes}
                        myVote={thread.my_vote}
                        isLoggedIn={isLoggedIn}
                    />
                    <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                                style={{ background: colors.bg, color: colors.text }}
                            >
                                {thread.category}
                            </span>
                            <span className="text-[11px] text-(--color-text-tertiary)">
                                {thread.author_name} · {timeAgo(thread.created_at)}
                            </span>
                        </div>
                        <h1 className="text-[17px] font-semibold text-(--color-text-primary) leading-snug">{thread.title}</h1>
                        <p className="mt-2 text-[14px] text-(--color-text-secondary) leading-relaxed whitespace-pre-wrap">{thread.body}</p>

                        <div className="mt-4 flex items-center gap-4 border-t-[0.5px] border-(--color-border-tertiary) pt-3 text-[12px] text-(--color-text-tertiary)">
                            <span className="flex items-center gap-1.5">
                                <MessageCircle size={13} aria-hidden="true" /> {thread.reply_count} replies
                            </span>
                            <button
                                type="button"
                                onClick={() => fileReport(supabase, router, isLoggedIn, window.location.pathname, 'thread', thread.id)}
                                className="flex items-center gap-1 border-none p-0 text-[12px] text-(--color-text-tertiary) hover:text-(--color-text-primary)"
                            >
                                <Flag size={12} aria-hidden="true" /> Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-4 shadow-(--shadow-card) sm:p-5">
                <p className="mb-3 text-[13px] font-medium text-(--color-text-primary)">Join the discussion</p>
                <ReplyComposer isLoggedIn={isLoggedIn} placeholder="Share your thoughts..." onSubmit={postTopLevelReply} />

                {topLevel.length > 0 && (
                    <div className="mt-4 divide-y-[0.5px] divide-(--color-border-tertiary) border-t-[0.5px] border-(--color-border-tertiary)">
                        {topLevel.map((reply) => (
                            <ReplyNode
                                key={reply.id}
                                reply={reply}
                                childrenByParent={childrenByParent}
                                threadId={thread.id}
                                isLoggedIn={isLoggedIn}
                                depth={0}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}