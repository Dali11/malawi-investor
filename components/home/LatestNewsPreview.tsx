import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight } from 'lucide-react'

export type NewsPreviewItem = {
    id: number
    headline: string
    published_at: string
    source_name: string | null
    image_url: string | null
    symbol: string | null
}

export function LatestNewsPreview({ items }: { items: NewsPreviewItem[] }) {
    return (
        <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
            <div className="flex items-center justify-between border-b-[0.5px] border-(--color-border-tertiary) px-4 py-3">
                <p className="text-[13px] font-bold text-(--color-text-primary)">Latest News</p>
                <Link
                    href="/news"
                    className="flex items-center gap-1 text-[12px] font-medium text-(--color-text-tertiary) no-underline transition-colors hover:text-(--color-text-primary)"
                >
                    View all
                    <ArrowRight size={12} aria-hidden="true" />
                </Link>
            </div>

            {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px] text-(--color-text-tertiary)">No headlines yet</p>
            ) : (
                items.map((n, i) => (
                    <Link
                        key={n.id}
                        href="/news"
                        className={`flex items-start gap-3 px-4 py-3 no-underline transition-colors hover:bg-(--color-background-secondary) ${i < items.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                    >
                        {n.image_url ? (
                            <img src={n.image_url} alt="" className="h-12 w-12 shrink-0 rounded-(--border-radius-md) object-cover" />
                        ) : (
                            <div className="h-12 w-12 shrink-0 rounded-(--border-radius-md) bg-(--color-background-tertiary)" />
                        )}
                        <div className="min-w-0">
                            <p className="text-[13px] leading-snug font-medium text-(--color-text-primary) line-clamp-2">
                                {n.headline}
                            </p>
                            <p className="mt-1 text-[11px] text-(--color-text-tertiary)">
                                {formatDistanceToNow(new Date(n.published_at), { addSuffix: true })}
                                {(n.symbol || n.source_name) && ` · ${n.symbol ?? n.source_name}`}
                            </p>
                        </div>
                    </Link>
                ))
            )}
        </div>
    )
}