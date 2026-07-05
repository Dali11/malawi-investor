// Single source of truth for how a Research post's byline is derived.
// analyses.author_id -> profiles.full_name (see
// scripts/analyses_add_author_migration.sql) is the real, dynamic path.
//
// DEFAULT_AUTHOR_NAME below is ONLY a label for legacy/unattributed posts
// (author_id is null) — e.g. articles published before this column
// existed, or published while nobody was signed in. It is NOT meant to
// represent a real person. If you're seeing this name on a NEW post,
// that means author_id didn't get set, which almost always means nobody
// had an active Supabase session when the post was published — check
// the "Publishing as ___" banner on /admin before hitting Publish.
export const DEFAULT_AUTHOR_NAME = 'Malawi Investor Team'

export function getAuthorName(profile?: { full_name?: string | null } | null): string {
    return profile?.full_name?.trim() || DEFAULT_AUTHOR_NAME
}

export function getAuthorInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
}
