import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { getSymbol, type Analysis } from '@/types/home'

export function LatestAnalysis({ items }: { items: Analysis[] }) {
    if (items.length === 0) return null

    return (
        <section>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-(--color-text-primary)">Latest news</h3>
                <Link
                    href="/news"
                    className="flex items-center gap-1 text-sm font-medium text-(--color-text-tertiary) no-underline transition-colors hover:text-(--color-text-primary)"
                >
                    See all <ArrowRight size={16} aria-hidden="true" />
                </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => {
                    const symbol = getSymbol(a.mse_counters)
                    return (
                        <Link key={a.id} href={`/news/${a.id}`} className="group no-underline">
                            <div className="h-full overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card) transition-all hover:-translate-y-1 hover:shadow-(--shadow-card-hover)">
                                {a.image_url && (
                                    <img src={a.image_url} alt={a.title} className="h-28 w-full object-cover" />
                                )}
                                <div className="p-4">
                                    {symbol && (
                                        <span className="mb-2 inline-block rounded-full bg-(--color-background-info) px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-text-info) uppercase">
                                            {symbol}
                                        </span>
                                    )}
                                    <p className="text-sm leading-snug font-semibold text-(--color-text-primary) transition-colors group-hover:text-(--color-text-info)">
                                        {a.title}
                                    </p>
                                    <p className="mt-2 text-xs text-(--color-text-tertiary)">
                                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}