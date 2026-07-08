// components/community/Avatar.tsx
import { avatarColorFor, initialsFor } from '@/lib/avatarColor'

export function Avatar({ userId, name, size = 24 }: { userId: string; name: string; size?: number }) {
    return (
        <div
            className="flex shrink-0 items-center justify-center rounded-full font-medium text-white"
            style={{
                width: size,
                height: size,
                background: avatarColorFor(userId),
                fontSize: size <= 24 ? 10 : 11,
            }}
        >
            {initialsFor(name)}
        </div>
    )
}