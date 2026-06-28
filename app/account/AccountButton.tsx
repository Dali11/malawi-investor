import Link from 'next/link'

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
}

export default function AccountButton({ name }: { name: string }) {
    const initials = getInitials(name) || '?'
    return (
        <Link
            href="/account"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-background-warning) text-[12px] font-bold text-(--color-text-warning) no-underline ring-2 ring-transparent hover:ring-(--color-border-warning) transition-all"
            title="My account"
            aria-label="My account"
        >
            {initials}
        </Link>
    )
}