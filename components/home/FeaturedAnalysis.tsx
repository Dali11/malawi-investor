import Link from 'next/link'
import { Flame } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getSymbol, type Analysis } from '@/types/home'


export function FeaturedAnalysis({
    analysis,
    related = [],
}: {
    analysis: Analysis
    related?: Analysis[]
}) {
    const symbol = getSymbol(analysis.mse_counters)

    return (
        <article className="space-y-3">
            {analysis.image_url && (
                <Link href={`/news/${analysis.id}`} className="block">
                    <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-secondary)">
                        <img
                            src={analysis.image_url}
                            alt={analysis.title}
                            className="h-auto max-h-[280px] w-full object-cover"
                        />
                    </div>
                </Link>
            )}

            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-(--color-text-warning) uppercase">
                <Flame size={14} aria-hidden="true" />
                Featured
            </div>

            <Link href={`/news/${analysis.id}`} className="group block no-underline">
                <h1 className="text-2xl leading-tight font-bold text-(--color-text-primary) transition-colors group-hover:text-(--color-text-info) sm:text-3xl">
                    {analysis.title}
                </h1>
            </Link>

            <p className="text-base leading-relaxed text-(--color-text-secondary)">
                {analysis.content
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 100)}…
            </p>

            <div className="flex flex-wrap items-center gap-2 text-sm text-(--color-text-tertiary)">
                <span className="font-medium text-(--color-text-secondary)">Bena Nkhoma</span>
                <span aria-hidden="true">·</span>
                <span>{formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}</span>
                {symbol && (
                    <>
                        <span aria-hidden="true">·</span>
                        <span className="rounded-full bg-(--color-background-info) px-2.5 py-0.5 text-xs font-semibold text-(--color-text-info)">
                            {symbol}
                        </span>
                    </>
                )}
            </div>


            {related.length > 0 && (
                <div className="pt-1">
                    <div className="mb-2 border-b-[0.5px] border-(--color-border-tertiary) pb-1.5 text-xs font-semibold tracking-wide text-(--color-text-tertiary) uppercase">
                        Related
                    </div>
                    <ul className="space-y-2">
                        {related.map((a) => (
                            <li key={a.id}>
                                <Link
                                    href={`/news/${a.id}`}
                                    className="block text-sm font-medium text-(--color-text-primary) no-underline transition-colors hover:text-(--color-text-info)"
                                >
                                    {a.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </article>
    )
}