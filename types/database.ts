export type MembershipTier = 'free' | 'member' | 'vip'

export interface Profile {
    id: string
    full_name: string | null
    email: string | null
    membership_tier: MembershipTier
    avatar_url: string | null
    created_at: string
}

export interface MseCounter {
    id: number
    symbol: string
    company_name: string
    sector: string | null
}

export interface MsePrice {
    id: number
    counter_id: number
    price: number
    change_pct: number | null
    market_cap: number | null
    pe_ratio: number | null
    price_date: string
}

export type IndexCode = 'MASI' | 'MDSI' | 'MFSI'

export interface MseIndex {
    id: number
    index_code: IndexCode
    value: number | null          // absolute index level — only published for MASI
    day_change_pct: number | null
    week_change_pct: number | null
    ytd_change_pct: number | null
    market_cap: number | null     // MWK, MASI row only
    index_date: string
}

export interface Analysis {
    id: string
    counter_id: number | null
    title: string
    content: string
    price_at_post: number | null
    pe_at_post: number | null
    market_cap_at_post: number | null
    published: boolean
    created_at: string
}

export type CorporateActionType = 'Dividend' | 'AGM' | 'Rights Issue' | 'Stock Split' | 'Report' | 'Announcement'

export interface CorporateAction {
    id: number
    counter_id: number | null
    type: CorporateActionType
    headline: string
    details: string | null
    action_date: string
    // Added by corporate_actions_add_source_migration.sql — populated
    // by scrape_corporate_actions.py, null for manually-entered rows.
    source_url: string | null
    source: 'manual' | 'scrape_african_markets'
    // Added by corporate_actions_add_slug_and_pdf_migration.sql —
    // populated by extract_corporate_action_details.py. Used by
    // /markets/corporate-actions/[slug].
    slug: string | null
    pdf_storage_path: string | null
    created_at: string
}

export interface NewsItem {
    id: number
    counter_id: number | null
    headline: string
    summary: string | null
    source_name: string | null
    source_url: string | null
    published_at: string
    created_at: string
}

export type IpoStatus = 'Upcoming' | 'Open' | 'Closed' | 'Listed'

export interface Ipo {
    id: number
    counter_id: number | null
    company_name: string
    sector: string | null
    status: IpoStatus
    offer_price: number | null
    shares_offered: number | null
    min_investment: number | null
    open_date: string | null
    close_date: string | null
    listing_date: string | null
    summary: string
    details: string | null
    prospectus_url: string | null
    created_at: string
}

export interface Course {
    id: string
    title: string
    description: string | null
    level: 'beginner' | 'intermediate' | 'advanced'
    is_free: boolean
    order_index: number | null
    published: boolean
}

export interface Lesson {
    id: string
    course_id: string
    title: string
    video_url: string | null
    notes: string | null
    has_demo: boolean
    has_quiz: boolean
    order_index: number | null
}

export interface SimPortfolio {
    id: string
    user_id: string
    cash_balance: number
}

export interface SimHolding {
    id: number
    portfolio_id: string
    counter_id: number
    shares: number
    avg_buy_price: number
}