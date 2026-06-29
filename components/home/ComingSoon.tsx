import type { LucideIcon } from 'lucide-react'

export default function ComingSoon({
    icon: Icon,
    title,
    description,
}: {
    icon: LucideIcon
    title: string
    description: string
}) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 14,
                padding: '64px 24px',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-lg)',
                background: 'var(--color-background-primary)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--border-radius-md)',
                    background: 'var(--color-background-warning)',
                    color: 'var(--color-text-warning)',
                }}
            >
                <Icon size={22} aria-hidden="true" />
            </div>
            <div>
                <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                    {title}
                </h1>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 360 }}>
                    {description}
                </p>
            </div>
            <span
                style={{
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: 0.3,
                    textTransform: 'uppercase',
                    color: 'var(--color-text-tertiary)',
                    border: '0.5px solid var(--color-border-tertiary)',
                    borderRadius: 999,
                    padding: '4px 10px',
                }}
            >
                Coming soon
            </span>
        </div>
    )
}
