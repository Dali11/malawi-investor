import Link from 'next/link'
import { BookOpen, LineChart, ClipboardList, FileBarChart, ShieldCheck, ArrowRight } from 'lucide-react'

export type LearnModule = {
    id: string
    slug: string
    title: string
    description: string | null
}

const ICONS = [BookOpen, LineChart, ClipboardList, FileBarChart, ShieldCheck]

export function LearnInvestingPreview({ modules }: { modules: LearnModule[] }) {
    if (modules.length === 0) return null

    return (
        <section>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-(--color-text-primary)">Learn Investing</h3>
                <Link
                    href="/learn"
                    className="flex items-center gap-1 text-sm font-medium text-(--color-text-tertiary) no-underline transition-colors hover:text-(--color-text-primary)"
                >
                    View all lessons <ArrowRight size={16} aria-hidden="true" />
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {modules.map((m, i) => {
                    const Icon = ICONS[i % ICONS.length]
                    return (
                        <Link key={m.id} href={`/learn/${m.slug}`} className="group no-underline">
                            <div className="h-full rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-4 shadow-(--shadow-card) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-card-hover)">
                                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-(--border-radius-md) bg-(--color-background-success)">
                                    <Icon size={17} className="text-(--color-text-success)" aria-hidden="true" />
                                </div>
                                <p className="text-[13px] font-semibold text-(--color-text-primary) transition-colors group-hover:text-(--color-text-info)">
                                    {m.title}
                                </p>
                                {m.description && (
                                    <p className="mt-1 text-[11px] text-(--color-text-tertiary) line-clamp-2">{m.description}</p>
                                )}
                                <p className="mt-2 text-[11px] font-medium text-(--color-text-tertiary)">Module {i + 1}</p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}