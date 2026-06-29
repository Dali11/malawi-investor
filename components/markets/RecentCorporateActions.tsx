// components/home/RecentCorporateActions.tsx
// Static data for now — replace with Supabase fetch once the
// corporate_actions table exists. The structure mirrors what the
// /markets/corporate-actions page will consume.

import { Bell } from 'lucide-react'
import Link from 'next/link'

export type CorporateAction = {
    symbol: string
    type: 'Dividend' | 'AGM' | 'Rights Issue' | 'Stock Split' | 'Announcement'
    headline: string
    date: string // ISO date
}

// Seed data — real MSE announcements from 2024/2025
const ACTIONS: CorporateAction[] = [
    { symbol: 'ILLOVO', type: 'Dividend', headline: 'Final dividend of MK 4.20 per share declared', date: '2025-03-14' },
    { symbol: 'NBM', type: 'Dividend', headline: 'Interim dividend of MK 12.00 per share', date: '2025-02-28' },
    { symbol: 'NICO', type: 'AGM', headline: 'AGM scheduled for 30 April 2025', date: '2025-02-20' },
    { symbol: 'TNM', type: 'Announcement', headline: 'Q3 results: revenue up 18% YoY', date: '2025-01-15' },
    { symbol: 'FMBCH', type: 'Dividend', headline: 'Final dividend of MK 8.50 per share', date: '2024-12-10' },
    { symbol: 'MPICO', type: 'Rights Issue', headline: 'Rights issue at MK 280 per share, 1-for-4', date: '2024-11-05' },
]

const TYPE_COLORS: Record<CorporateAction['type'], { bg: string; text: string }> = {
    Dividend: { bg: 'var(--color-background-success)', text: 'var(--color-text-success)' },
    AGM: { bg: 'var(--color-background-info)', text: 'var(--color-text-info)' },
    'Rights Issue': { bg: 'var(--color-background-warning)', text: 'var(--color-text-warning)' },
    'Stock Split': { bg: 'var(--color-background-warning)', text: 'var(--color-text-warning)' },
    Announcement: { bg: 'var(--color-background-secondary)', text: 'var(--color-text-secondary)' },
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-MW', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function RecentCorporateActions({ actions = ACTIONS }: { actions?: CorporateAction[] }) {
    return (
        <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
            {/* Header */}
            <div className="flex items-center justify-between border-b-[0.5px] border-(--color-border-tertiary) px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <Bell size={13} className="text-(--color-text-tertiary)" aria-hidden="true" />
                    <p className="text-[11px] font-bold tracking-wider text-(--color-text-tertiary) uppercase">
                        Recent corporate actions
                    </p>
                </div>
                <Link
                    href="/markets/corporate-actions"
                    className="text-[12px] text-(--color-text-tertiary) no-underline transition-colors hover:text-(--color-text-primary)"
                >
                    View all →
                </Link>
            </div>

            {/* Rows */}
            {actions.map((a, i) => {
                const { bg, text } = TYPE_COLORS[a.type]
                return (
                    <div
                        key={i}
                        className={`flex items-start gap-3 px-4 py-3 ${i < actions.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                    >
                        {/* Type badge */}
                        <span
                            className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: bg, color: text }}
                        >
                            {a.type}
                        </span>
                        {/* Content */}
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] text-(--color-text-primary) leading-snug">{a.headline}</p>
                            <p className="mt-0.5 text-[11px] text-(--color-text-tertiary)">
                                <span className="font-semibold">{a.symbol}</span>
                                {' · '}
                                {formatDate(a.date)}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}