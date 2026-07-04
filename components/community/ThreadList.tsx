// components/community/ThreadList.tsx
'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { VoteButtons } from '@/components/community/VoteButtons'
import { CATEGORY_COLORS, type CommunityThreadRow } from '@/types/community'
import { timeAgo } from '@/lib/timeAgo'

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
                            targetType="thread"
                            targetId={t.id}
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