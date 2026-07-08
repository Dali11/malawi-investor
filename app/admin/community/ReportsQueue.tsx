// app/admin/community/ReportsQueue.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { ReportRow } from './page'
import { resolveCommunityReport } from './actions'

function timeAgo(iso: string) {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

function ReportCard({ report }: { report: ReportRow }) {
    const [isPending, startTransition] = useTransition()
    const [resolved, setResolved] = useState(false)

    function act(action: 'dismiss' | 'hide' | 'remove') {
        startTransition(async () => {
            await resolveCommunityReport(report.id, action, report.target_type, report.target_id)
            setResolved(true)
        })
    }

    if (resolved) return null

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium capitalize">{report.target_type}</span>
                    <span>reported by {report.reporter_name}</span>
                    <span>· {timeAgo(report.created_at)}</span>
                    {report.content_status !== 'visible' && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                            already {report.content_status}
                        </span>
                    )}
                </div>
                <Link
                    href={`/community/${report.thread_id}`}
                    target="_blank"
                    className="text-xs text-gray-500 hover:text-gray-900"
                >
                    View live →
                </Link>
            </div>

            {report.reason && (
                <p className="mb-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">
                    Reason: {report.reason}
                </p>
            )}

            <div className="mb-3 rounded border border-gray-100 bg-gray-50 p-3">
                {report.content_title && <p className="mb-1 text-sm font-medium text-gray-900">{report.content_title}</p>}
                <p className="text-sm whitespace-pre-wrap text-gray-700">{report.content_body}</p>
                <p className="mt-2 text-xs text-gray-400">by {report.content_author_name}</p>
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={isPending}
                    onClick={() => act('dismiss')}
                    className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Dismiss report
                </button>
                <button
                    type="button"
                    disabled={isPending}
                    onClick={() => act('hide')}
                    className="rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                >
                    Hide content
                </button>
                <button
                    type="button"
                    disabled={isPending}
                    onClick={() => act('remove')}
                    className="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                    Remove content
                </button>
            </div>
        </div>
    )
}

export function ReportsQueue({ reports }: { reports: ReportRow[] }) {
    if (reports.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                No open reports — queue is clear.
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {reports.map((r) => <ReportCard key={r.id} report={r} />)}
        </div>
    )
}