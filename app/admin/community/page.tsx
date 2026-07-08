// app/admin/community/page.tsx
// Moderation queue: every open community_reports row, with the actual
// reported content resolved inline so a reviewer doesn't have to click
// through to the live thread to see what's being flagged. Uses the
// service-role key (see actions.ts) rather than the anon client that
// the rest of /admin uses — community_reports has no public SELECT
// policy at all, by design, so this is the only way to read it.

import Link from 'next/link'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { ReportsQueue } from './ReportsQueue'

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

export type ReportRow = {
    id: string
    target_type: 'thread' | 'reply'
    target_id: string
    reason: string | null
    created_at: string
    reporter_name: string
    content_body: string
    content_title: string | null
    content_status: string
    content_author_name: string
    thread_id: string
}

export const revalidate = 0

export default async function CommunityReportsPage() {
    const supabase = getServiceClient()

    const { data: reports } = await supabase
        .from('community_reports')
        .select('id, target_type, target_id, reason, created_at, reporter_id')
        .eq('status', 'open')
        .order('created_at', { ascending: true })

    const openReports = reports ?? []

    const threadTargetIds = openReports.filter((r) => r.target_type === 'thread').map((r) => r.target_id)
    const replyTargetIds = openReports.filter((r) => r.target_type === 'reply').map((r) => r.target_id)

    const [{ data: threads }, { data: replies }] = await Promise.all([
        threadTargetIds.length
            ? supabase.from('community_threads').select('id, title, body, status, user_id').in('id', threadTargetIds)
            : Promise.resolve({ data: [] as { id: string; title: string; body: string; status: string; user_id: string }[] }),
        replyTargetIds.length
            ? supabase.from('community_replies').select('id, thread_id, body, status, user_id').in('id', replyTargetIds)
            : Promise.resolve({ data: [] as { id: string; thread_id: string; body: string; status: string; user_id: string }[] }),
    ])

    const threadById = new Map((threads ?? []).map((t) => [t.id, t]))
    const replyById = new Map((replies ?? []).map((r) => [r.id, r]))

    const userIds = [
        ...new Set([
            ...openReports.map((r) => r.reporter_id),
            ...(threads ?? []).map((t) => t.user_id),
            ...(replies ?? []).map((r) => r.user_id),
        ]),
    ]
    const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
        : { data: [] as { id: string; full_name: string | null }[] }
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name || 'Investor']))

    const rows: ReportRow[] = openReports
        .map((r): ReportRow | null => {
            if (r.target_type === 'thread') {
                const t = threadById.get(r.target_id)
                if (!t) return null
                return {
                    id: r.id,
                    target_type: 'thread' as const,
                    target_id: r.target_id,
                    reason: r.reason,
                    created_at: r.created_at,
                    reporter_name: nameById.get(r.reporter_id) ?? 'Investor',
                    content_body: t.body,
                    content_title: t.title,
                    content_status: t.status,
                    content_author_name: nameById.get(t.user_id) ?? 'Investor',
                    thread_id: t.id,
                }
            }
            const rep = replyById.get(r.target_id)
            if (!rep) return null
            return {
                id: r.id,
                target_type: 'reply' as const,
                target_id: r.target_id,
                reason: r.reason,
                created_at: r.created_at,
                reporter_name: nameById.get(r.reporter_id) ?? 'Investor',
                content_body: rep.body,
                content_title: null,
                content_status: rep.status,
                content_author_name: nameById.get(rep.user_id) ?? 'Investor',
                thread_id: rep.thread_id,
            }
        })
        .filter((r): r is ReportRow => r !== null)

    return (
        <div className="mx-auto max-w-3xl p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Community reports</h1>
                    <p className="mt-1 text-sm text-gray-500">{rows.length} open report{rows.length === 1 ? '' : 's'}</p>
                </div>
                <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">← Admin home</Link>
            </div>

            <ReportsQueue reports={rows} />
        </div>
    )
}