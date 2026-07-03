import Link from 'next/link'
import { SlidersHorizontal, LineChart, CalendarClock, Landmark, ArrowRight } from 'lucide-react'

const tools = [
    {
        icon: SlidersHorizontal,
        title: 'Stock Screener',
        description: 'Find stocks that match your criteria',
        href: '/markets/screeners',
    },
    {
        icon: LineChart,
        title: 'Portfolio Tracker',
        description: 'Track your investments performance',
        href: '/simulator',
    },
    {
        icon: CalendarClock,
        title: 'Dividend Calendar',
        description: 'Never miss a dividend payment',
        href: '/markets/calendar',
    },
    {
        icon: Landmark,
        title: 'Economic Calendar',
        description: 'Key economic events and indicators',
        href: '/markets/calendar',
    },
]

export function ToolsForInvestors() {
    return (
        <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
            <div className="border-b-[0.5px] border-(--color-border-tertiary) px-4 py-3">
                <p className="text-[13px] font-bold text-(--color-text-primary)">Tools for Investors</p>
            </div>

            {tools.map((t, i) => (
                <Link
                    key={t.title}
                    href={t.href}
                    className={`flex items-start gap-3 px-4 py-3 no-underline transition-colors hover:bg-(--color-background-secondary) ${i < tools.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-(--border-radius-md) bg-(--color-background-tertiary)">
                        <t.icon size={15} className="text-(--color-text-secondary)" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-[13px] font-semibold text-(--color-text-primary)">{t.title}</p>
                        <p className="text-[11px] text-(--color-text-tertiary)">{t.description}</p>
                    </div>
                </Link>
            ))}

            <Link
                href="/markets/screeners"
                className="flex items-center justify-center gap-1.5 border-t-[0.5px] border-(--color-border-tertiary) px-4 py-3 text-[12px] font-medium text-(--color-text-secondary) no-underline transition-colors hover:bg-(--color-background-secondary) hover:text-(--color-text-primary)"
            >
                View all tools
                <ArrowRight size={12} aria-hidden="true" />
            </Link>
        </div>
    )
}