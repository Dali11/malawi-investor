// app/(public)/markets/ipos/page.tsx
// Full IPO feed: upcoming, open, closed and completed listings on the MSE.
// Data comes from the `ipos` table (scripts/ipos_schema.sql), entered via
// /admin/ipos. Mirrors the corporate-actions page pattern: server-side
// fetch, client-side filter/search component.

import { Rocket } from 'lucide-react'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import ComingSoon from '@/components/home/ComingSoon'
import { IposList, type IpoRow } from './IposList'

export const revalidate = 3600 // re-fetch at most once per hour

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

// Upcoming/open IPOs first (soonest close date), then closed, then listed
// (most recently listed first).
const STATUS_ORDER = { Upcoming: 0, Open: 0, Closed: 1, Listed: 2 } as const

export default async function IposPage() {
    const supabase = getServiceClient()

    const { data: rawIpos } = await supabase
        .from('ipos')
        .select('id, company_name, sector, status, offer_price, shares_offered, min_investment, open_date, close_date, listing_date, summary, prospectus_url, mse_counters(symbol)')
        .order('listing_date', { ascending: false })
        .limit(200)

    const mapped: IpoRow[] = (rawIpos ?? [])
        .map((i: any) => ({
            id: i.id,
            symbol: i.mse_counters?.symbol ?? null,
            company_name: i.company_name,
            sector: i.sector,
            status: i.status,
            offer_price: i.offer_price,
            shares_offered: i.shares_offered,
            min_investment: i.min_investment,
            open_date: i.open_date,
            close_date: i.close_date,
            listing_date: i.listing_date,
            summary: i.summary,
            prospectus_url: i.prospectus_url,
        }))

    const ipos: IpoRow[] = mapped
        .sort((a, b) => {
            const order = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
            if (order !== 0) return order
            // Within the same bucket, soonest close date first for
            // upcoming/open, most recent listing date first for listed.
            const aDate = a.close_date ?? a.listing_date ?? ''
            const bDate = b.close_date ?? b.listing_date ?? ''
            return a.status === 'Listed' ? bDate.localeCompare(aDate) : aDate.localeCompare(bDate)
        })

    if (ipos.length === 0) {
        return (
            <ComingSoon
                icon={Rocket}
                title="IPOs"
                description="Upcoming and past initial public offerings on the Malawi Stock Exchange. Check back soon — entries are added as they're announced."
            />
        )
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-[20px] font-semibold text-(--color-text-primary)">IPOs</h1>
                <p className="mt-0.5 text-[13px] text-(--color-text-tertiary)">
                    {ipos.length} offering{ipos.length === 1 ? '' : 's'} — upcoming, open, closed and listed
                </p>
            </div>

            <IposList ipos={ipos} />
        </div>
    )
}
