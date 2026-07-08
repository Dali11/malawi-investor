// lib/avatarColor.ts
const PALETTE = [
    '#0F6E56', // teal
    '#993C1D', // coral
    '#534AB7', // indigo
    '#993556', // rose
    '#3B6D11', // green
    '#185FA5', // blue
    '#854F0B', // amber
    '#712B13', // brick
]

export function avatarColorFor(userId: string) {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
        hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
    }
    return PALETTE[hash % PALETTE.length]
}

export function initialsFor(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
}