'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
    ChevronDown,
    LayoutDashboard,
    TrendingUp,
    Landmark,
    BarChart3,
    Building2,
    Rocket,
    SlidersHorizontal,
    Calendar,
    type LucideIcon,
} from 'lucide-react'
import { marketsLinks, type MarketsIconKey } from '@/lib/marketsNav'

const ICONS: Record<MarketsIconKey, LucideIcon> = {
    overview: LayoutDashboard,
    stocks: TrendingUp,
    bonds: Landmark,
    indices: BarChart3,
    'corporate-actions': Building2,
    ipos: Rocket,
    screeners: SlidersHorizontal,
    calendar: Calendar,
}

export default function MarketsDropdown() {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return

        function onPointerDown(e: PointerEvent) {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
        }
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    return (
        <div ref={rootRef} className="relative isolate">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={open}
                className="flex items-center gap-1 text-[16px] text-(--color-text-secondary) no-underline transition-colors hover:text-black"
            >
                Markets
                <ChevronDown
                    size={15}
                    aria-hidden="true"
                    className="transition-transform"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute left-0 top-[calc(100%+10px)] w-[320px] overflow-hidden rounded-(--border-radius-lg) p-1.5"
                    style={{
                        zIndex: 9999,
                        backgroundColor: 'var(--color-background-primary)',
                        border: '0.5px solid var(--color-border-tertiary)',
                        boxShadow: 'var(--shadow-card-hover, 0 4px 16px rgba(0,0,0,0.12))',
                    }}
                >
                    {marketsLinks.map(({ label, href, description, icon }) => {
                        const Icon = ICONS[icon]
                        return (
                            <Link
                                key={href}
                                href={href}
                                role="menuitem"
                                onClick={() => setOpen(false)}
                                className="flex items-start gap-3 rounded-(--border-radius-md) px-2.5 py-2 no-underline transition-colors hover:bg-(--color-background-secondary)"
                            >
                                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-(--border-radius-md) bg-(--color-background-warning) text-(--color-text-warning)">
                                    <Icon size={14} aria-hidden="true" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[13.5px] font-medium text-(--color-text-primary)">
                                        {label}
                                    </span>
                                    <span className="block truncate text-[12px] leading-snug text-(--color-text-tertiary)">
                                        {description}
                                    </span>
                                </span>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}