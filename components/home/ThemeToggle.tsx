'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

/**
 * Toggles between the public site's light and dark palettes.
 * The initial class is set synchronously by the inline script in
 * app/layout.tsx (before hydration), so this component just reads
 * whatever class is already on <html> and flips it from there.
 */
export default function ThemeToggle() {
    const [theme, setTheme] = useState<'theme-dark' | 'theme-light' | null>(null)

    useEffect(() => {
        const current = document.documentElement.classList.contains('theme-light')
            ? 'theme-light'
            : 'theme-dark'
        setTheme(current)
    }, [])

    function toggle() {
        const next = theme === 'theme-dark' ? 'theme-light' : 'theme-dark'
        document.documentElement.classList.remove('theme-dark', 'theme-light')
        document.documentElement.classList.add(next)
        try {
            localStorage.setItem('mi-theme', next)
        } catch {
            /* ignore (e.g. private browsing) */
        }
        setTheme(next)
    }

    // Avoid rendering the wrong icon for a frame before we've read <html>
    if (!theme) return <div className="h-8 w-8" aria-hidden="true" />

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'theme-dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-(--border-radius-md) text-(--color-text-secondary) transition-colors hover:bg-(--color-background-secondary) hover:text-(--color-text-primary)"
        >
            {theme === 'theme-dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
    )
}
