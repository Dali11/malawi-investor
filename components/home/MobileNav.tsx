'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Search, ChevronDown } from 'lucide-react'
import { marketsLinks } from '@/lib/marketsNav'

type NavLink = { label: string; href: string }

export default function MobileNav({
    navLinks,
    user,
}: {
    navLinks: NavLink[]
    user: boolean
}) {
    const [open, setOpen] = useState(false)
    const [marketsOpen, setMarketsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="md:hidden flex items-center justify-center p-1.5 text-(--color-text-primary)"
                aria-label="Open menu"
            >
                <Menu size={22} />
            </button>

            {open && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute top-0 right-0 h-full w-[78%] max-w-[300px] bg-(--color-background-primary) shadow-xl flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b-[0.5px] border-(--color-border-tertiary)">
                            <span className="flex items-center gap-2 text-[16px] font-semibold text-(--color-text-primary)">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M3 17l6-6 4 4 8-8" stroke="var(--color-brand)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M15 7h6v6" stroke="var(--color-brand)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Malawi Investor
                            </span>
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Close menu"
                                className="p-1.5 text-(--color-text-secondary)"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-3 pt-4">
                            <div className="relative">
                                <Search
                                    className="absolute top-1/2 left-2.5 -translate-y-1/2 text-(--color-text-tertiary)"
                                    size={14}
                                    aria-hidden="true"
                                />
                                <input
                                    type="text"
                                    placeholder="Symbols, courses, glossary…"
                                    className="h-9 w-full rounded-(--border-radius-md) pl-8 text-sm border-[0.5px] border-(--color-border-secondary)"
                                />
                            </div>
                        </div>

                        <nav className="flex flex-col gap-1 px-3 py-4">
                            {navLinks.map(({ label, href }) => {
                                if (label === 'Markets') {
                                    return (
                                        <div key={href}>
                                            <button
                                                type="button"
                                                onClick={() => setMarketsOpen((v) => !v)}
                                                aria-expanded={marketsOpen}
                                                className="flex w-full items-center justify-between rounded-(--border-radius-md) px-3 py-2.5 text-[15px] text-(--color-text-primary) hover:bg-(--color-background-secondary)"
                                            >
                                                Markets
                                                <ChevronDown
                                                    size={16}
                                                    aria-hidden="true"
                                                    className="transition-transform"
                                                    style={{ transform: marketsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                                />
                                            </button>
                                            {marketsOpen && (
                                                <div className="flex flex-col gap-0.5 pl-3">
                                                    {marketsLinks.map((m) => (
                                                        <Link
                                                            key={m.href}
                                                            href={m.href}
                                                            onClick={() => setOpen(false)}
                                                            className="rounded-(--border-radius-md) px-3 py-2 text-[14px] text-(--color-text-secondary) no-underline hover:bg-(--color-background-secondary) hover:text-(--color-text-primary)"
                                                        >
                                                            {m.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                }
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setOpen(false)}
                                        className="rounded-(--border-radius-md) px-3 py-2.5 text-[15px] text-(--color-text-primary) no-underline hover:bg-(--color-background-secondary)"
                                    >
                                        {label}
                                    </Link>
                                )
                            })}
                        </nav>

                        {!user && (
                            <div className="mt-auto px-3 py-4 border-t-[0.5px] border-(--color-border-tertiary)">
                                <Link
                                    href="/signup"
                                    onClick={() => setOpen(false)}
                                    className="block rounded-(--border-radius-md) bg-(--color-brand) px-4 py-2 text-center text-sm font-semibold text-[#062012] no-underline"
                                >
                                    Join free
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}