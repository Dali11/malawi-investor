'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Search, ChevronDown, User } from 'lucide-react'
import { marketsLinks } from '@/lib/marketsNav'

type NavLink = { label: string; href: string }

export default function MobileNav({
    navLinks,
    user,
    userName,
}: {
    navLinks: NavLink[]
    user: boolean
    userName?: string
}) {
    const [open, setOpen] = useState(false)
    const [marketsOpen, setMarketsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    // Lock body scroll while the drawer is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden'
            // Give the drawer a beat to mount before focusing
            const t = setTimeout(() => inputRef.current?.focus(), 150)
            return () => {
                document.body.style.overflow = ''
                clearTimeout(t)
            }
        }
    }, [open])

    function submitSearch(e: React.FormEvent) {
        e.preventDefault()
        const q = query.trim()
        if (!q) return
        setOpen(false)
        router.push(`/search?q=${encodeURIComponent(q)}`)
    }

    function initials(name: string) {
        return name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || '?'
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center justify-center rounded-(--border-radius-md) p-1.5 text-(--color-text-primary) hover:bg-(--color-background-secondary) md:hidden"
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
                    <div className="absolute top-0 right-0 flex h-full w-[82%] max-w-[320px] flex-col bg-(--color-background-primary) shadow-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b-[0.5px] border-(--color-border-tertiary)">
                            <Link
                                href="/"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 text-[16px] font-semibold text-(--color-text-primary) no-underline"
                            >
                                <Image src="/logo.png" alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
                                Malawi Investor
                            </Link>
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Close menu"
                                className="rounded-(--border-radius-md) p-1.5 text-(--color-text-secondary) hover:bg-(--color-background-secondary)"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {user && (
                            <Link
                                href="/account"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 px-5 py-3.5 border-b-[0.5px] border-(--color-border-tertiary) no-underline hover:bg-(--color-background-secondary)"
                            >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-background-warning) text-[12px] font-bold text-(--color-text-warning)">
                                    {userName ? initials(userName) : <User size={14} />}
                                </span>
                                <span className="text-[14px] font-medium text-(--color-text-primary)">
                                    My account
                                </span>
                            </Link>
                        )}

                        <div className="flex-1 overflow-y-auto">
                            <form onSubmit={submitSearch} className="px-3 pt-4">
                                <div className="relative">
                                    <Search
                                        className="absolute top-1/2 left-2.5 -translate-y-1/2 text-(--color-text-tertiary)"
                                        size={14}
                                        aria-hidden="true"
                                    />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Symbols, articles, glossary…"
                                        className="h-9 w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-secondary) pl-8 pr-3 text-sm outline-none focus:border-(--color-brand) focus:bg-(--color-background-primary) transition-colors"
                                    />
                                </div>
                            </form>

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
                        </div>

                        {!user && (
                            <div className="mt-auto flex gap-2 px-3 py-4 border-t-[0.5px] border-(--color-border-tertiary)">
                                <Link
                                    href="/login"
                                    onClick={() => setOpen(false)}
                                    className="flex-1 rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) px-4 py-2 text-center text-sm font-medium text-(--color-text-primary) no-underline"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/signup"
                                    onClick={() => setOpen(false)}
                                    className="flex-1 rounded-(--border-radius-md) bg-(--color-brand) px-4 py-2 text-center text-sm font-semibold text-[#062012] no-underline"
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