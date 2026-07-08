// app/admin/community/actions.ts
'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

// Dismiss = the report itself wasn't valid; content stays untouched.
// Hide = soft moderation, content excluded from public reads but kept
//   for later review (RLS on community_threads/community_replies only
//   selects status='visible' — see community_schema.sql).
// Remove = same mechanism as hide (status='removed'), distinguished
//   only so the queue/audit trail shows which action was taken.
export async function resolveCommunityReport(
    reportId: string,
    action: 'dismiss' | 'hide' | 'remove',
    targetType: 'thread' | 'reply',
    targetId: string,
) {
    const supabase = getServiceClient()

    if (action !== 'dismiss') {
        const table = targetType === 'thread' ? 'community_threads' : 'community_replies'
        const status = action === 'hide' ? 'hidden' : 'removed'
        await supabase.from(table).update({ status }).eq('id', targetId)
    }

    await supabase
        .from('community_reports')
        .update({ status: action === 'dismiss' ? 'dismissed' : 'resolved' })
        .eq('id', reportId)

    revalidatePath('/admin/community')
}