import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { getSymbol, type Analysis } from '@/types/home'

function excerpt(html: string, len = 90) {
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, len)
}

export function TopAnalysisPreview({ featured, related }: { featured: Analysis; related: Analysis[] }) {
    const symbol = getSymbol(featured.mse_counters)

    return (
        <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
            <div className="flex items-center justify-between border-b-[0.5px] border-(--color-border-tertiary) px-4 py-3">
                <p className="text-[13px] font-bold text-(--color-text-primary)">Top Analysis</p>
                <Link
                    href="/research"
                    className="flex items-center gap-1 text-[12px] font-medium text-(--color-text-tertiary) no-underline transition-colors hover:text-(--color-text-primary)"
                >
                    View all
                    <ArrowRight size={12} aria-hidden="true" />
                </Link>
            </div>

            <Link href={`/research/${featured.id}`} className="block border-b-[0.5px] border-(--color-border-tertiary) p-4 no-underline">
                {featured.image_url && (
                    <div className="mb-3 overflow-hidden rounded-(--border-radius-md)">
                        <img src={featured.image_url} alt={featured.title} className="h-32 w-full object-cover" />
                    </div>
                )}
                <span className="mb-1.5 inline-block rounded-full bg-(--color-background-warning) px-2 py-0.5 text-[10px] font-bold tracking-wide text-(--color-text-warning) uppercase">
                    Featured
                </span>
                <p className="text-[14px] leading-snug font-bold text-(--color-text-primary)">{featured.title}</p>
                <p className="mt-1 text-[12px] leading-snug text-(--color-text-secondary)">{excerpt(featured.content)}…</p>
                <p className="mt-2 text-[11px] text-(--color-text-tertiary)">
                    {formatDistanceToNow(new Date(featured.created_at), { addSuffix: true })}
                    {symbol && ` · ${symbol}`}
                </p>
            </Link>

            {related.length > 0 && (
                <p className="border-b-[0.5px] border-(--color-border-tertiary) px-4 pt-3 pb-1.5 text-[11px] font-bold tracking-wide text-(--color-text-tertiary) uppercase">
                    Related
                </p>
            )}
            {related.map((a, i) => {
                const sym = getSymbol(a.mse_counters)
                return (
                    <Link
                        key={a.id}
                        href={`/research/${a.id}`}
                        className={`block px-4 py-3 no-underline transition-colors hover:bg-(--color-background-secondary) ${i < related.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}
                    >
                        <p className="text-[13px] leading-snug font-medium text-(--color-text-primary) line-clamp-2">{a.title}</p>
                        <p className="mt-1 text-[11px] text-(--color-text-tertiary)">
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                            {sym && ` · ${sym}`}
                        </p>
                    </Link>
                )
            })}
        </div>
    )
}