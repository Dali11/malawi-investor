import Link from 'next/link'
import { MessageCircle, ArrowRight } from 'lucide-react'
import { getSymbol, type CommunityThread } from '@/types/home'

export function CommunityPulse({ threads }: { threads: CommunityThread[] }) {
    if (threads.length === 0) return null

    return (
        <div className="flex flex-col">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[17px] font-semibold text-(--color-text-primary)">What Community is Saying?</h3>
                <Link
                    href="/community"
                    className="flex items-center gap-1 text-[12px] font-medium text-(--color-text-tertiary) no-underline transition-colors hover:text-(--color-text-primary)"
                >
                    See all <ArrowRight size={12} aria-hidden="true" />
                </Link>
            </div>
            <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-[var(--shadow-card)]">
                {threads.map((t, i) => {
                    const symbol = getSymbol(t.mse_counters)
                    return (
                        <Link key={t.id} href={`/community/${t.id}`} className="no-underline">
                            <div className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-(--color-background-secondary) ${i < threads.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''}`}>
                                <MessageCircle size={14} className="shrink-0 text-(--color-text-tertiary)" aria-hidden="true" />
                                <span className="flex-1 text-[13px] font-medium leading-snug text-(--color-text-primary)">{t.title}</span>
                                <div className="flex shrink-0 items-center gap-2">
                                    {symbol && (
                                        <span className="rounded-full bg-(--color-background-info) px-2 py-0.5 text-[10px] font-semibold text-(--color-text-info)">{symbol}</span>
                                    )}
                                    <span className="text-[11px] tabular-nums text-(--color-text-tertiary)">
                                        {t.reply_count ?? 0} {t.reply_count === 1 ? 'reply' : 'replies'}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}