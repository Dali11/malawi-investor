// types/community.ts
export const COMMUNITY_CATEGORIES = [
    'General Discussion',
    'Beginner Questions',
    'Market News',
    'Dividends & IPOs',
    'Off-topic',
] as const

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    'General Discussion': { bg: 'var(--color-background-tertiary)', text: 'var(--color-text-secondary)' },
    'Beginner Questions': { bg: 'var(--color-background-success)', text: 'var(--color-text-success)' },
    'Market News': { bg: 'var(--color-background-info)', text: 'var(--color-text-info)' },
    'Dividends & IPOs': { bg: 'var(--color-background-warning)', text: 'var(--color-text-warning)' },
    'Off-topic': { bg: 'var(--color-background-tertiary)', text: 'var(--color-text-secondary)' },
}

export type CommunityThreadRow = {
    id: string
    title: string
    body: string
    category: string
    upvotes: number
    downvotes: number
    reply_count: number
    created_at: string
    last_activity_at: string
    user_id: string
    author_name: string
    my_vote: 1 | -1 | null
}

export type CommunityReplyRow = {
    id: string
    thread_id: string
    parent_reply_id: string | null
    body: string
    upvotes: number
    downvotes: number
    created_at: string
    user_id: string
    author_name: string
    my_vote: 1 | -1 | null
}