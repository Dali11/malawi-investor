import Link from 'next/link'
import { Flame } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getSymbol, type Analysis, type PriceMover } from '@/types/home'
import { MarketSnapshot } from './MarketSnapshot'


export function FeaturedAnalysis({
    analysis,
    secondStory,
    related = [],
    movers = [],
}: {
    analysis: Analysis
    secondStory?: Analysis
    related?: Analysis[]
    movers?: PriceMover[]
}) {
    const symbol = getSymbol(analysis.mse_counters)
    const secondSymbol = secondStory ? getSymbol(secondStory.mse_counters) : null

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
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

                    <p className="text-base leading-relaxed text-(--color-text-secondary)">
                        {analysis.content
                            .replace(/<[^>]*>/g, ' ')
                            .replace(/&nbsp;/g, ' ')
                            .replace(/&amp;/g, '&')
                            .replace(/\s+/g, ' ')
                            .trim()
                            .slice(0, 100)}…
                    </p>
                </Link>

                <div className="flex flex-wrap items-center gap-2 text-sm text-(--color-text-tertiary)">
                    <span className="font-medium text-(--color-text-secondary)">Dali Kamphani</span>
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

                {secondStory && (
                    <div className="border-t-[0.5px] border-(--color-border-tertiary) pt-5">
                        <Link href={`/news/${secondStory.id}`} className="group block no-underline">
                            <h2 className="text-lg leading-snug font-bold text-(--color-text-primary) transition-colors group-hover:text-(--color-text-info)">
                                {secondStory.title}
                            </h2>
                            <p className="mt-1 text-sm leading-relaxed text-(--color-text-secondary)">
                                {secondStory.content
                                    .replace(/<[^>]*>/g, ' ')
                                    .replace(/&nbsp;/g, ' ')
                                    .replace(/&amp;/g, '&')
                                    .replace(/\s+/g, ' ')
                                    .trim()
                                    .slice(0, 100)}…
                            </p>
                        </Link>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-(--color-text-tertiary)">
                            <span className="font-medium text-(--color-text-secondary)">Dali Kamphani</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatDistanceToNow(new Date(secondStory.created_at), { addSuffix: true })}</span>
                            {secondSymbol && (
                                <>
                                    <span aria-hidden="true">·</span>
                                    <span className="rounded-full bg-(--color-background-info) px-2 py-0.5 text-xs font-semibold text-(--color-text-info)">
                                        {secondSymbol}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {movers.length > 0 && (
                    <div className="pt-2 lg:hidden">
                        <MarketSnapshot movers={movers} />
                    </div>
                )}

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

            {movers.length > 0 && (
                <div className="hidden lg:block">
                    <MarketSnapshot movers={movers} />
                </div>
            )}
        </div>
    )
}