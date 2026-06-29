import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import {
    User, BookOpen, Star, Clock, LogOut,
    TrendingUp, ChevronRight, Shield
} from 'lucide-react'
import SignOutButton from './SignOutButton'



export default async function AccountPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login?redirect=/account')

    const fullName = user.user_metadata?.full_name ?? ''
    const email = user.email ?? ''
    const initials = fullName
        ? fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        : email[0].toUpperCase()
    const memberSince = formatDistanceToNow(new Date(user.created_at), { addSuffix: true })

    // Fetch reading history — last 6 articles viewed (from analyses table directly,
    // ordered by created_at as proxy until you add a views/history table)
    const { data: recentArticles } = await supabase
        .from('analyses')
        .select('id, title, created_at, image_url, mse_counters(symbol)')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(6)

    // Fetch watchlist if you have a watchlist table
    // If not yet created, this returns empty and the section shows the empty state
    const { data: watchlist } = await supabase
        .from('watchlist')
        .select('symbol, mse_counters(symbol, company_name)')
        .eq('user_id', user.id)
        .limit(20)

    // Module progress
    const { data: progress } = await supabase
        .from('module_progress')
        .select('module_id, completed_at')
        .eq('user_id', user.id)

    const completedCount = progress?.length ?? 0

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">

            {/* ── Profile header ── */}
            <div className="mb-8 flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-(--color-background-warning) text-[18px] font-bold text-(--color-text-warning)">
                        {initials}
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold text-(--color-text-primary)">
                            {fullName || 'Your account'}
                        </h1>
                        <p className="text-[13px] text-(--color-text-tertiary)">{email}</p>
                        <p className="text-[12px] text-(--color-text-tertiary) mt-0.5">
                            Member {memberSince}
                        </p>
                    </div>
                </div>
                <SignOutButton />
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-4 text-center shadow-(--shadow-card)">
                    <p className="text-[22px] font-bold text-(--color-text-primary)">{watchlist?.length ?? 0}</p>
                    <p className="text-[11px] text-(--color-text-tertiary) mt-0.5">Watching</p>
                </div>
                <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-4 text-center shadow-(--shadow-card)">
                    <p className="text-[22px] font-bold text-(--color-text-primary)">{completedCount}</p>
                    <p className="text-[11px] text-(--color-text-tertiary) mt-0.5">Modules done</p>
                </div>
                <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-4 text-center shadow-(--shadow-card)">
                    <p className="text-[22px] font-bold text-(--color-text-warning)">
                        {completedCount >= 5 ? '🏆' : completedCount >= 3 ? '🥈' : completedCount >= 1 ? '🥉' : '—'}
                    </p>
                    <p className="text-[11px] text-(--color-text-tertiary) mt-0.5">Badge</p>
                </div>
            </div>

            {/* ── Watchlist ── */}
            <section className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Star size={15} className="text-(--color-text-warning)" />
                        <h2 className="text-[15px] font-bold text-(--color-text-primary)">Watchlist</h2>
                    </div>
                    <Link href="/mse" className="text-[12px] text-(--color-text-info) no-underline hover:underline">
                        Browse MSE →
                    </Link>
                </div>

                {watchlist && watchlist.length > 0 ? (
                    <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) overflow-hidden shadow-(--shadow-card)">
                        {watchlist.map((w: any, i: number) => {
                            const sym = w.mse_counters?.symbol ?? w.symbol
                            const name = w.mse_counters?.company_name ?? ''
                            return (
                                <Link
                                    key={sym}
                                    href={`/mse/${sym?.toLowerCase()}`}
                                    className={`flex items-center justify-between px-4 py-3 no-underline hover:bg-(--color-background-secondary) transition-colors ${i < watchlist.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-background-info) text-[11px] font-bold text-(--color-text-info)">
                                            {sym?.slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold text-(--color-text-primary)">{sym}</p>
                                            <p className="text-[11px] text-(--color-text-tertiary)">{name}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-(--color-text-tertiary)" />
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="rounded-(--border-radius-lg) border-[0.5px] border-dashed border-(--color-border-secondary) bg-(--color-background-secondary) px-6 py-8 text-center">
                        <TrendingUp size={24} className="mx-auto mb-2 text-(--color-text-tertiary)" />
                        <p className="text-[13px] font-medium text-(--color-text-secondary)">No counters watched yet</p>
                        <p className="text-[12px] text-(--color-text-tertiary) mt-1 mb-3">
                            Visit any MSE counter page and tap the star to add it here.
                        </p>
                        <Link
                            href="/mse"
                            className="inline-block rounded-(--border-radius-md) bg-(--color-background-warning) px-4 py-1.5 text-[12px] font-semibold text-(--color-text-warning) no-underline hover:opacity-90"
                        >
                            Browse counters →
                        </Link>
                    </div>
                )}
            </section>

            {/* ── Learning progress ── */}
            <section className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen size={15} className="text-(--color-text-warning)" />
                        <h2 className="text-[15px] font-bold text-(--color-text-primary)">Learning progress</h2>
                    </div>
                    <Link href="/learn" className="text-[12px] text-(--color-text-info) no-underline hover:underline">
                        Continue learning →
                    </Link>
                </div>

                <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-4 shadow-(--shadow-card)">
                    {completedCount === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-[13px] text-(--color-text-secondary) mb-3">
                                You haven't started any modules yet.
                            </p>
                            <Link
                                href="/learn"
                                className="inline-block rounded-(--border-radius-md) bg-[#ef9f27] px-4 py-1.5 text-[12px] font-bold text-[#412402] no-underline hover:opacity-90"
                            >
                                Start learning →
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[13px] text-(--color-text-secondary)">
                                    {completedCount} of 5 modules completed
                                </p>
                                <p className="text-[12px] font-semibold text-(--color-text-warning)">
                                    {Math.round((completedCount / 5) * 100)}%
                                </p>
                            </div>
                            {/* Progress bar */}
                            <div className="h-2 w-full rounded-full bg-(--color-background-secondary) overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[#ef9f27] transition-all"
                                    style={{ width: `${Math.round((completedCount / 5) * 100)}%` }}
                                />
                            </div>
                            {completedCount < 5 && (
                                <Link
                                    href="/learn"
                                    className="mt-3 block text-center text-[12px] font-medium text-(--color-text-info) no-underline hover:underline"
                                >
                                    Continue where you left off →
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* ── Recent articles ── */}
            <section className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                    <Clock size={15} className="text-(--color-text-warning)" />
                    <h2 className="text-[15px] font-bold text-(--color-text-primary)">Recent news</h2>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(recentArticles ?? []).map((a: any) => (
                        <Link
                            key={a.id}
                            href={`/news/${a.id}`}
                            className="group flex items-center gap-3 rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-3 no-underline shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-card-hover)"
                        >
                            <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-[#0c1f3d]">
                                {a.image_url
                                    ? <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                                    : <div className="h-full w-full" />
                                }
                            </div>
                            <div className="min-w-0">
                                {a.mse_counters?.symbol && (
                                    <span className="mb-0.5 inline-block text-[10px] font-bold text-(--color-text-info)">
                                        {a.mse_counters.symbol}
                                    </span>
                                )}
                                <p className="truncate text-[12px] font-semibold text-(--color-text-primary) group-hover:text-(--color-text-info) transition-colors">
                                    {a.title}
                                </p>
                                <p className="text-[10px] text-(--color-text-tertiary)">
                                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── Account settings ── */}
            <section>
                <div className="mb-3 flex items-center gap-2">
                    <Shield size={15} className="text-(--color-text-warning)" />
                    <h2 className="text-[15px] font-bold text-(--color-text-primary)">Account</h2>
                </div>

                <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) overflow-hidden shadow-(--shadow-card)">
                    <Link
                        href="/account/edit-profile"
                        className="flex items-center justify-between px-4 py-3 no-underline hover:bg-(--color-background-secondary) border-b-[0.5px] border-(--color-border-tertiary) transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <User size={14} className="text-(--color-text-tertiary)" />
                            <span className="text-[13px] text-(--color-text-primary)">Edit profile</span>
                        </div>
                        <ChevronRight size={14} className="text-(--color-text-tertiary)" />
                    </Link>

                    <Link
                        href="/account/change-password"
                        className="flex items-center justify-between px-4 py-3 no-underline hover:bg-(--color-background-secondary) border-b-[0.5px] border-(--color-border-tertiary) transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Shield size={14} className="text-(--color-text-tertiary)" />
                            <span className="text-[13px] text-(--color-text-primary)">Change password</span>
                        </div>
                        <ChevronRight size={14} className="text-(--color-text-tertiary)" />
                    </Link>

                    <div className="px-4 py-3">
                        <SignOutButton variant="row" />
                    </div>
                </div>
            </section>

        </div>
    )
}