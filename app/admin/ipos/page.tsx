// app/admin/ipos/page.tsx
// Lightweight form for adding/updating IPO entries (upcoming, open, closed,
// listed). Counter is optional — most IPOs don't have an mse_counters row
// until they actually list, so link it once status moves to 'Listed'.

'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { IpoStatus } from '@/types/database'

const STATUSES: IpoStatus[] = ['Upcoming', 'Open', 'Closed', 'Listed']

export default function IposAdminPage() {
    const [counters, setCounters] = useState<any[]>([])
    const [recent, setRecent] = useState<any[]>([])

    const [counterId, setCounterId] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [sector, setSector] = useState('')
    const [status, setStatus] = useState<IpoStatus>('Upcoming')
    const [offerPrice, setOfferPrice] = useState('')
    const [sharesOffered, setSharesOffered] = useState('')
    const [minInvestment, setMinInvestment] = useState('')
    const [openDate, setOpenDate] = useState('')
    const [closeDate, setCloseDate] = useState('')
    const [listingDate, setListingDate] = useState('')
    const [summary, setSummary] = useState('')
    const [details, setDetails] = useState('')
    const [prospectusUrl, setProspectusUrl] = useState('')

    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    function loadRecent() {
        supabase
            .from('ipos')
            .select('id, company_name, status, listing_date, close_date, mse_counters(symbol)')
            .order('created_at', { ascending: false })
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
        setCounterId('')
        setCompanyName('')
        setSector('')
        setStatus('Upcoming')
        setOfferPrice('')
        setSharesOffered('')
        setMinInvestment('')
        setOpenDate('')
        setCloseDate('')
        setListingDate('')
        setSummary('')
        setDetails('')
        setProspectusUrl('')
    }

    async function handleSubmit() {
        if (!companyName.trim() || !summary.trim()) {
            setError('Company name and summary are required')
            return
        }
        setLoading(true); setError(null); setSuccess(false)
        try {
            const { error: insertError } = await supabase.from('ipos').insert({
                counter_id: counterId ? parseInt(counterId) : null,
                company_name: companyName.trim(),
                sector: sector.trim() || null,
                status,
                offer_price: offerPrice ? parseFloat(offerPrice) : null,
                shares_offered: sharesOffered ? parseInt(sharesOffered) : null,
                min_investment: minInvestment ? parseFloat(minInvestment) : null,
                open_date: openDate || null,
                close_date: closeDate || null,
                listing_date: listingDate || null,
                summary: summary.trim(),
                details: details.trim() || null,
                prospectus_url: prospectusUrl.trim() || null,
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
        await supabase.from('ipos').delete().eq('id', id)
        loadRecent()
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="text-[20px] font-semibold text-gray-900">IPOs</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">
                Add or track an initial public offering on the Malawi Stock Exchange.
            </p>

            <div className="mt-6 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5">
                {/* Company name */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Company name</label>
                    <input
                        type="text"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="e.g. Malawi Telecommunications Ltd"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    />
                </div>

                {/* Counter (optional, once listed) */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">
                        Linked counter <span className="text-gray-400">(optional — set once listed)</span>
                    </label>
                    <select
                        value={counterId}
                        onChange={e => setCounterId(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    >
                        <option value="">Not linked yet…</option>
                        {counters.map(c => (
                            <option key={c.id} value={c.id}>{c.symbol} — {c.company_name}</option>
                        ))}
                    </select>
                </div>

                {/* Sector */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Sector</label>
                    <input
                        type="text"
                        value={sector}
                        onChange={e => setSector(e.target.value)}
                        placeholder="e.g. Telecommunications"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    />
                </div>

                {/* Status */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Status</label>
                    <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStatus(s)}
                                className={`cursor-pointer rounded-full border-none px-3 py-1 text-[12px] font-medium transition-colors ${
                                    status === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Offer price / shares / min investment */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="mb-1 block text-[12px] font-medium text-gray-600">Offer price (MWK)</label>
                        <input
                            type="number"
                            value={offerPrice}
                            onChange={e => setOfferPrice(e.target.value)}
                            placeholder="e.g. 25"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[12px] font-medium text-gray-600">Shares offered</label>
                        <input
                            type="number"
                            value={sharesOffered}
                            onChange={e => setSharesOffered(e.target.value)}
                            placeholder="e.g. 50000000"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[12px] font-medium text-gray-600">Min. investment (MWK)</label>
                        <input
                            type="number"
                            value={minInvestment}
                            onChange={e => setMinInvestment(e.target.value)}
                            placeholder="e.g. 5000"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                        />
                    </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="mb-1 block text-[12px] font-medium text-gray-600">Opens</label>
                        <input
                            type="date"
                            value={openDate}
                            onChange={e => setOpenDate(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[12px] font-medium text-gray-600">Closes</label>
                        <input
                            type="date"
                            value={closeDate}
                            onChange={e => setCloseDate(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[12px] font-medium text-gray-600">Listing date</label>
                        <input
                            type="date"
                            value={listingDate}
                            onChange={e => setListingDate(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                        />
                    </div>
                </div>

                {/* Summary */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Summary</label>
                    <input
                        type="text"
                        value={summary}
                        onChange={e => setSummary(e.target.value)}
                        placeholder="One or two sentences shown in the IPO list"
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
                        placeholder="Use of proceeds, how to apply, venue, etc."
                        className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    />
                </div>

                {/* Prospectus URL */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Prospectus URL (optional)</label>
                    <input
                        type="url"
                        value={prospectusUrl}
                        onChange={e => setProspectusUrl(e.target.value)}
                        placeholder="https://…"
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
                    {loading ? 'Saving…' : 'Add IPO'}
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
                                    <p className="truncate text-[12px] text-gray-900">{r.company_name}</p>
                                    <p className="text-[11px] text-gray-400">
                                        {r.mse_counters?.symbol ?? 'Unlisted'} · {r.status}
                                        {r.listing_date ? ` · ${r.listing_date}` : r.close_date ? ` · closes ${r.close_date}` : ''}
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
