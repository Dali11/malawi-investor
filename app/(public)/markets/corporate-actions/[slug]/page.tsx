// app/(public)/markets/corporate-actions/[slug]/page.tsx
// Detail view for a single corporate action. Reached from the headline
// link on the list page. Shows the full `details` text (extracted by
// scripts/extract_corporate_action_details.py) and a Download PDF button
// pointing at the copy stored in the `corporate-action-pdfs` Supabase
// Storage bucket — NOT the original african-markets.com link, so this
// keeps working even if that source page changes or goes down.

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Download, ArrowLeft } from 'lucide-react'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const revalidate = 3600

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
    Dividend: { bg: 'var(--color-background-success)', text: 'var(--color-text-success)' },
    AGM: { bg: 'var(--color-background-info)', text: 'var(--color-text-info)' },
    'Rights Issue': { bg: 'var(--color-background-warning)', text: 'var(--color-text-warning)' },
    'Stock Split': { bg: 'var(--color-background-warning)', text: 'var(--color-text-warning)' },
    Report: { bg: 'var(--color-background-info)', text: 'var(--color-text-info)' },
    Announcement: { bg: 'var(--color-background-secondary)', text: 'var(--color-text-secondary)' },
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-MW', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function CorporateActionDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = getServiceClient()

    const { data: action } = await supabase
        .from('corporate_actions')
        .select('type, headline, details, action_date, pdf_storage_path, mse_counters(symbol, company_name)')
        .eq('slug', slug)
        .single()

    if (!action) {
        notFound()
    }

    const counter = (action as any).mse_counters as { symbol: string; company_name: string } | null
    const { bg, text } = TYPE_COLORS[action.type] ?? TYPE_COLORS.Announcement

    const pdfUrl = action.pdf_storage_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/corporate-action-pdfs/${action.pdf_storage_path}`
        : null

    return (
        <div className="space-y-4">
            <Link
                href="/markets/corporate-actions"
                className="inline-flex items-center gap-1.5 text-[13px] text-(--color-text-tertiary) no-underline hover:text-(--color-text-primary)"
            >
                <ArrowLeft size={14} />
                Corporate Actions
            </Link>

            <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) p-5 shadow-(--shadow-card)">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <span
                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: bg, color: text }}
                        >
                            {action.type}
                        </span>
                        <h1 className="mt-2 text-[19px] font-semibold leading-snug text-(--color-text-primary)">
                            {action.headline}
                        </h1>
                        <p className="mt-1 text-[12px] text-(--color-text-tertiary)">
                            {counter ? (
                                <>
                                    <Link
                                        href={`/mse/${counter.symbol.toLowerCase()}`}
                                        className="font-semibold text-(--color-text-primary) no-underline hover:underline"
                                    >
                                        {counter.symbol}
                                    </Link>
                                    {counter.company_name && <> · {counter.company_name}</>}
                                </>
                            ) : (
                                <span className="font-semibold text-(--color-text-primary)">MSE</span>
                            )}
                            {' · '}
                            {formatDate(action.action_date)}
                        </p>
                    </div>

                    {pdfUrl && (
                        <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex shrink-0 items-center gap-1.5 rounded-(--border-radius-md) bg-(--color-text-primary) px-3.5 py-2 text-[13px] font-medium text-(--color-background-primary) no-underline"
                        >
                            <Download size={14} />
                            Download PDF
                        </a>
                    )}
                </div>

                {action.details ? (
                    <p className="mt-4 whitespace-pre-line text-[13px] leading-relaxed text-(--color-text-secondary)">
                        {action.details}
                    </p>
                ) : (
                    <p className="mt-4 text-[13px] text-(--color-text-tertiary)">
                        {pdfUrl
                            ? 'Full text could not be extracted from this filing — download the PDF to read it.'
                            : 'No further details available for this announcement.'}
                    </p>
                )}
            </div>
        </div>
    )
}