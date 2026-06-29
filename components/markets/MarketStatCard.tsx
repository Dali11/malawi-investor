// components/home/MarketStatCard.tsx
import type { LucideIcon } from 'lucide-react'

export function MarketStatCard({
    label,
    value,
    sub,
    icon: Icon,
    sentiment,
}: {
    label: string
    value: string
    sub?: string
    icon: LucideIcon
    sentiment?: 'positive' | 'negative' | 'neutral'
}) {
    const bgVar =
        sentiment === 'positive'
            ? 'var(--color-background-success)'
            : sentiment === 'negative'
                ? 'var(--color-background-danger)'
                : 'var(--color-background-warning)'
    const textVar =
        sentiment === 'positive'
            ? 'var(--color-text-success)'
            : sentiment === 'negative'
                ? 'var(--color-text-danger)'
                : 'var(--color-text-warning)'

    return (
        <div
            className="flex items-start gap-3 rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-4 shadow-(--shadow-card)"
        >
            <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-(--border-radius-md)"
                style={{ background: bgVar, color: textVar }}
            >
                <Icon size={15} aria-hidden="true" />
            </span>
            <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-wide text-(--color-text-tertiary) uppercase">
                    {label}
                </p>
                <p className="mt-0.5 text-[17px] font-semibold text-(--color-text-primary) leading-tight">
                    {value}
                </p>
                {sub && (
                    <p className="mt-0.5 text-[12px] text-(--color-text-tertiary)">{sub}</p>
                )}
            </div>
        </div>
    )
}