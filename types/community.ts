// types/community.ts
export const COMMUNITY_CATEGORIES = [
    'General Discussion',
    'Beginner Questions',
    'Market News',
    'Dividends & IPOs',
    'Off-topic',
] as const

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]

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