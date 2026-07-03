// app/(public)/community/page.tsx
// Thread list. Public read (anyone can browse), gated write (voting,
// replying, posting all require login — see ThreadList/VoteButtons).
//
// Sort: defaults to "most active" (last_activity_at desc), which a
// trigger on community_replies bumps forward on every new reply at any
// nesting depth — see community_add_last_activity_migration.sql. This
// is the only sort wired up for now; "Newest"/"Top" can follow later.

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { COMMUNITY_CATEGORIES, type CommunityThreadRow } from '@/types/community'
import { ThreadList } from '@/components/community/ThreadList'

export const revalidate = 0

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('community_threads')
    .select('id, title, body, category, upvotes, downvotes, reply_count, created_at, last_activity_at, user_id')
    .order('last_activity_at', { ascending: false })
    .limit(50)

  if (category && (COMMUNITY_CATEGORIES as readonly string[]).includes(category)) {
    query = query.eq('category', category)
  }

  const { data: rawThreads } = await query
  const threads = rawThreads ?? []

  // Author names: community_threads.user_id and profiles.id both
  // point at auth.users independently, so there's no FK PostgREST
  // can auto-embed — fetch profiles separately and merge in JS.
  const userIds = [...new Set(threads.map((t) => t.user_id))]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] as { id: string; full_name: string | null }[] }
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name || 'Investor']))

  // Current user's votes on these threads, so the arrows can show
  // which way (if any) they've already voted.
  let voteByThreadId = new Map<string, 1 | -1>()
  if (user && threads.length > 0) {
    const { data: votes } = await supabase
      .from('community_votes')
      .select('target_id, value')
      .eq('user_id', user.id)
      .eq('target_type', 'thread')
      .in('target_id', threads.map((t) => t.id))
    voteByThreadId = new Map((votes ?? []).map((v) => [v.target_id, v.value as 1 | -1]))
  }

  const rows: CommunityThreadRow[] = threads.map((t) => ({
    ...t,
    author_name: nameById.get(t.user_id) ?? 'Investor',
    my_vote: voteByThreadId.get(t.id) ?? null,
  }))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/community"
            className={`rounded-full px-3 py-1.5 text-[12px] font-medium no-underline whitespace-nowrap ${!category
                ? 'bg-(--color-text-primary) text-(--color-background-primary)'
                : 'border-[0.5px] border-(--color-border-tertiary) text-(--color-text-secondary) hover:text-(--color-text-primary)'
              }`}
          >
            All
          </Link>
          {COMMUNITY_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/community?category=${encodeURIComponent(c)}`}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium no-underline whitespace-nowrap ${category === c
                  ? 'bg-(--color-text-primary) text-(--color-background-primary)'
                  : 'border-[0.5px] border-(--color-border-tertiary) text-(--color-text-secondary) hover:text-(--color-text-primary)'
                }`}
            >
              {c}
            </Link>
          ))}
        </div>

        <Link
          href={user ? '/community/new' : '/login?redirect=/community/new'}
          className="flex shrink-0 items-center gap-1.5 rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) px-3.5 py-2 text-[13px] font-medium text-(--color-text-primary) no-underline hover:bg-(--color-background-secondary)"
        >
          New thread
        </Link>
      </div>

      <ThreadList threads={rows} isLoggedIn={!!user} />
    </div>
  )
}