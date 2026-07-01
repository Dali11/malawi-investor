// app/admin/corporate-actions/page.tsx
// Lightweight form for adding corporate action entries (dividends, AGMs,
// rights issues, splits, announcements). No rich text needed here — these
// are short, structured records, unlike the analysis editor at /admin.

'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type CorporateActionType = 'Dividend' | 'AGM' | 'Rights Issue' | 'Stock Split' | 'Report' | 'Announcement'
const TYPES: CorporateActionType[] = ['Dividend', 'AGM', 'Rights Issue', 'Stock Split', 'Report', 'Announcement']

export default function CorporateActionsAdminPage() {
    const [counters, setCounters] = useState<any[]>([])
    const [recent, setRecent] = useState<any[]>([])

    const [counterId, setCounterId] = useState('')
    const [type, setType] = useState<CorporateActionType>('Dividend')
    const [headline, setHeadline] = useState('')
    const [details, setDetails] = useState('')
    const [actionDate, setActionDate] = useState(() => new Date().toISOString().slice(0, 10))

    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    function loadRecent() {
        supabase
            .from('corporate_actions')
            .select('id, type, headline, action_date, mse_counters(symbol)')
            .order('action_date', { ascending: false })
            .limit(15)
            .then(({ data }) => { if (data) setRecent(data) })
    }

    useEffect(() => {
        supabase.from('mse_counters').select('*').order('symbol').then(({ data }) => {
            if (data) setCounters(data)
        })
        loadRecent()
    }, [])

    function resetForm() {
        setHeadline('')
        setDetails('')
        setActionDate(new Date().toISOString().slice(0, 10))
    }

    async function handleSubmit() {
        if (!counterId || !headline.trim() || !actionDate) {
            setError('Counter, headline and date are required')
            return
        }
        setLoading(true); setError(null); setSuccess(false)
        try {
            const { error: insertError } = await supabase.from('corporate_actions').insert({
                counter_id: parseInt(counterId),
                type,
                headline: headline.trim(),
                details: details.trim() || null,
                action_date: actionDate,
            })
            if (insertError) throw insertError
            setSuccess(true)
            resetForm()
            loadRecent()
        } catch (e: any) {
            setError(e.message ?? 'Failed to save')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: number) {
        await supabase.from('corporate_actions').delete().eq('id', id)
        loadRecent()
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="text-[20px] font-semibold text-gray-900">Corporate Actions</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">
                Add dividends, AGMs, rights issues, splits or announcements for a listed counter.
            </p>

            <div className="mt-6 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5">
                {/* Counter */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Counter</label>
                    <select
                        value={counterId}
                        onChange={e => setCounterId(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    >
                        <option value="">Select a counter…</option>
                        {counters.map(c => (
                            <option key={c.id} value={c.id}>{c.symbol} — {c.company_name}</option>
                        ))}
                    </select>
                </div>

                {/* Type */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Type</label>
                    <div className="flex flex-wrap gap-1.5">
                        {TYPES.map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`cursor-pointer rounded-full border-none px-3 py-1 text-[12px] font-medium transition-colors ${type === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Headline */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Headline</label>
                    <input
                        type="text"
                        value={headline}
                        onChange={e => setHeadline(e.target.value)}
                        placeholder="e.g. Final dividend of MK 4.20 per share declared"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    />
                </div>

                {/* Details */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Details (optional)</label>
                    <textarea
                        value={details}
                        onChange={e => setDetails(e.target.value)}
                        rows={3}
                        placeholder="Extra context — ex-dividend date, payment date, ratio, venue, etc."
                        className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    />
                </div>

                {/* Date */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Date</label>
                    <input
                        type="date"
                        value={actionDate}
                        onChange={e => setActionDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    />
                </div>

                {error && <p className="text-[12px] text-red-600">{error}</p>}
                {success && <p className="text-[12px] text-green-600">Saved.</p>}

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="cursor-pointer rounded-lg border-none bg-amber-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                >
                    {loading ? 'Saving…' : 'Add corporate action'}
                </button>
            </div>

            {/* Recent entries */}
            <div className="mt-8">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">Recent entries</p>
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    {recent.length === 0 ? (
                        <p className="px-4 py-6 text-center text-[12px] text-gray-400">No entries yet</p>
                    ) : (
                        recent.map((r, i) => (
                            <div
                                key={r.id}
                                className={`flex items-center justify-between gap-3 px-4 py-2.5 ${i < recent.length - 1 ? 'border-b border-gray-100' : ''}`}
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-[12px] text-gray-900">{r.headline}</p>
                                    <p className="text-[11px] text-gray-400">
                                        {r.mse_counters?.symbol ?? '—'} · {r.type} · {r.action_date}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(r.id)}
                                    className="shrink-0 cursor-pointer border-none bg-transparent text-[11px] text-gray-400 hover:text-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}