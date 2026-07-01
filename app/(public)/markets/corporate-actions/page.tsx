// app/(public)/markets/corporate-actions/page.tsx
// Full corporate actions feed: dividends, AGMs, rights issues, splits and
// announcements across all MSE counters. Data comes from the
// `corporate_actions` table (scripts/corporate_actions_schema.sql),
// entered via /admin/corporate-actions. Mirrors the stocks page pattern:
// server-side fetch, client-side filter/search component.

import { Building2 } from 'lucide-react'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import ComingSoon from '@/components/home/ComingSoon'
import { CorporateActionsList, type CorporateActionRow } from './CorporateActionsList'

export const revalidate = 3600 // re-fetch at most once per hour

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

export default async function CorporateActionsPage() {
    const supabase = getServiceClient()

    const { data: rawActions } = await supabase
        .from('corporate_actions')
        .select('type, headline, details, action_date, slug, mse_counters(symbol, company_name)')
        .order('action_date', { ascending: false })
        .limit(200)

    // Previously this filtered out any row without a matched counter_id,
    // which silently dropped every exchange-wide notice (counter_id=null
    // is valid per the schema) AND every row scrape_corporate_actions.py
    // holds back for review. Show them with a null symbol instead —
    // CorporateActionsList renders those as "MSE" rather than a ticker.
    const actions: CorporateActionRow[] = (rawActions ?? []).map((a: any) => ({
        symbol: a.mse_counters?.symbol ?? null,
        company_name: a.mse_counters?.company_name ?? null,
        type: a.type,
        headline: a.headline,
        details: a.details,
        date: a.action_date,
        slug: a.slug,
    }))

    if (actions.length === 0) {
        return (
            <ComingSoon
                icon={Building2}
                title="Corporate Actions"
                description="Dividends, stock splits, rights issues and other corporate actions across listed companies. Check back soon — entries are added as they're announced."
            />
        )
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-[20px] font-semibold text-(--color-text-primary)">Corporate Actions</h1>
                <p className="mt-0.5 text-[13px] text-(--color-text-tertiary)">
                    {actions.length} announcement{actions.length === 1 ? '' : 's'} across MSE-listed companies
                </p>
            </div>

            <CorporateActionsList actions={actions} />
        </div>
    )
}