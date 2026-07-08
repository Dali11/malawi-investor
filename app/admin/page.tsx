// app/admin/page.tsx
// The analysis editor — write and publish long-form Research pieces
// (Latest Analysis, Undervalued Stocks, Dividend Stocks, Weekly Recap,
// Economic Outlook, Sector Analysis). This is the root /admin page
// deliberately: analyses are the primary content type, so they get the
// top-level route, while the lighter-weight structured record types
// (news, IPOs, corporate actions) live at their own nested /admin/*
// routes, linked from the panel on the right below.
//
// NOTE: this file previously contained an exact copy-paste of
// app/admin/corporate-actions/page.tsx (wrong file entirely — the
// comments in news/page.tsx and corporate-actions/page.tsx both
// reference "the analysis editor at /admin", which didn't actually
// exist here). This rebuild is that missing editor.

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

import { formatDistanceToNow } from 'date-fns'
import { ANALYSIS_CATEGORIES, AnalysisCategory } from '@/lib/analysisCategories'

type RecentAnalysis = {
    id: string
    title: string
    category: AnalysisCategory
    published: boolean
    created_at: string
    mse_counters: { symbol: string } | { symbol: string }[] | null
}

function counterSymbol(mc: RecentAnalysis['mse_counters']): string | null {
    if (!mc) return null
    return Array.isArray(mc) ? mc[0]?.symbol ?? null : mc.symbol
}

const EMPTY_CONTENT = '<p></p>'

export default function AnalysisAdminPage() {
    const [counters, setCounters] = useState<any[]>([])
    const [recent, setRecent] = useState<RecentAnalysis[]>([])

    const [editingId, setEditingId] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [counterId, setCounterId] = useState('')
    const [category, setCategory] = useState<AnalysisCategory>('latest')
    const [content, setContent] = useState(EMPTY_CONTENT)
    const [imageUrl, setImageUrl] = useState('')
    const [priceAtPost, setPriceAtPost] = useState('')
    const [peAtPost, setPeAtPost] = useState('')
    const [marketCapAtPost, setMarketCapAtPost] = useState('')
    const [published, setPublished] = useState(false)

    const [loading, setLoading] = useState(false)
    const [fetchingSnapshot, setFetchingSnapshot] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    const loadRecent = useCallback(() => {
        supabase
            .from('analyses')
            .select('id, title, category, published, created_at, mse_counters(symbol)')
            .order('created_at', { ascending: false })
            .limit(20)
            .then(({ data }) => { if (data) setRecent(data as unknown as RecentAnalysis[]) })
    }, [supabase])

    useEffect(() => {
        supabase.from('mse_counters').select('*').order('symbol').then(({ data }) => {
            if (data) setCounters(data)
        })
        loadRecent()
    }, [supabase, loadRecent])

    function resetForm() {
        setEditingId(null)
        setTitle('')
        setCounterId('')
        setCategory('latest')
        setContent(EMPTY_CONTENT)
        setImageUrl('')
        setPriceAtPost('')
        setPeAtPost('')
        setMarketCapAtPost('')
        setPublished(false)
    }

    // Pulls the counter's latest known price/P-E/market cap from
    // mse_prices so you don't have to look them up and type them in by
    // hand — these are just a snapshot for the "Price at post" stat
    // boxes on the article, not a live-updating figure.
    async function fetchSnapshot() {
        if (!counterId) {
            setError('Pick a counter first')
            return
        }
        setFetchingSnapshot(true); setError(null)
        try {
            const { data, error: fetchError } = await supabase
                .from('mse_prices')
                .select('price, pe_ratio, market_cap')
                .eq('counter_id', parseInt(counterId))
                .order('price_date', { ascending: false })
                .limit(1)
                .maybeSingle()
            if (fetchError) throw fetchError
            if (!data) {
                setError('No price history found for that counter')
                return
            }
            if (data.price != null) setPriceAtPost(String(data.price))
            if (data.pe_ratio != null) setPeAtPost(String(data.pe_ratio))
            if (data.market_cap != null) setMarketCapAtPost(String(data.market_cap))
        } catch (e: any) {
            setError(e.message ?? 'Failed to fetch snapshot')
        } finally {
            setFetchingSnapshot(false)
        }
    }

    async function handleEdit(id: string) {
        setError(null)
        const { data, error: fetchError } = await supabase
            .from('analyses')
            .select('id, title, category, content, image_url, counter_id, price_at_post, pe_at_post, market_cap_at_post, published')
            .eq('id', id)
            .single()
        if (fetchError || !data) {
            setError(fetchError?.message ?? 'Failed to load analysis')
            return
        }
        setEditingId(data.id)
        setTitle(data.title)
        setCounterId(data.counter_id != null ? String(data.counter_id) : '')
        setCategory((data.category as AnalysisCategory) ?? 'latest')
        setContent(data.content || EMPTY_CONTENT)
        setImageUrl(data.image_url ?? '')
        setPriceAtPost(data.price_at_post != null ? String(data.price_at_post) : '')
        setPeAtPost(data.pe_at_post != null ? String(data.pe_at_post) : '')
        setMarketCapAtPost(data.market_cap_at_post != null ? String(data.market_cap_at_post) : '')
        setPublished(data.published)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function handleSubmit() {
        const isEmpty = !content || content === EMPTY_CONTENT || content === '<p></p>'
        if (!title.trim() || isEmpty) {
            setError('Title and content are required')
            return
        }
        setLoading(true); setError(null); setSuccess(false)
        try {
            const payload = {
                title: title.trim(),
                counter_id: counterId ? parseInt(counterId) : null,
                category,
                content,
                image_url: imageUrl.trim() || null,
                price_at_post: priceAtPost ? parseFloat(priceAtPost) : null,
                pe_at_post: peAtPost ? parseFloat(peAtPost) : null,
                market_cap_at_post: marketCapAtPost ? parseFloat(marketCapAtPost) : null,
                published,
            }

            const { error: writeError } = editingId
                ? await supabase.from('analyses').update(payload).eq('id', editingId)
                : await supabase.from('analyses').insert(payload)

            if (writeError) throw writeError
            setSuccess(true)
            resetForm()
            loadRecent()
        } catch (e: any) {
            setError(e.message ?? 'Failed to save')
        } finally {
            setLoading(false)
        }
    }

    async function handleTogglePublished(row: RecentAnalysis) {
        await supabase.from('analyses').update({ published: !row.published }).eq('id', row.id)
        loadRecent()
    }

    async function handleDelete(id: string) {
        if (!window.confirm('Delete this analysis? This can\u2019t be undone.')) return
        await supabase.from('analyses').delete().eq('id', id)
        if (editingId === id) resetForm()
        loadRecent()
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-[20px] font-semibold text-gray-900">Analysis</h1>
                    <p className="mt-0.5 text-[13px] text-gray-500">
                        Write and publish Research pieces for /research.
                    </p>
                </div>
                <div className="shrink-0 text-right text-[11px] text-gray-400">
                    <p className="mb-1 font-semibold uppercase tracking-widest">Other admin sections</p>
                    <div className="flex flex-col gap-0.5">
                        <Link href="/admin/news" className="text-gray-500 hover:text-gray-900">News</Link>
                        <Link href="/admin/ipos" className="text-gray-500 hover:text-gray-900">IPOs</Link>
                        <Link href="/admin/corporate-actions" className="text-gray-500 hover:text-gray-900">Corporate Actions</Link>
                        <Link href="/admin/community" className="text-gray-500 hover:text-gray-900">Community Reports</Link>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5">
                {editingId && (
                    <div className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                        <span>Editing an existing analysis</span>
                        <button type="button" onClick={resetForm} className="cursor-pointer border-none bg-transparent font-semibold text-amber-800 underline">
                            Cancel
                        </button>
                    </div>
                )}

                {/* Title */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Why NBM still looks cheap after its 40% run"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Category</label>
                    <div className="flex flex-wrap gap-1.5">
                        {ANALYSIS_CATEGORIES.map(c => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setCategory(c.value)}
                                title={c.description}
                                className={`cursor-pointer rounded-full border-none px-3 py-1 text-[12px] font-medium transition-colors ${category === c.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Counter */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">
                        Related counter <span className="text-gray-400">(optional)</span>
                    </label>
                    <select
                        value={counterId}
                        onChange={e => setCounterId(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    >
                        <option value="">Not stock-specific…</option>
                        {counters.map(c => (
                            <option key={c.id} value={c.id}>{c.symbol} — {c.company_name}</option>
                        ))}
                    </select>
                </div>

                {/* Content */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Content</label>
                    <RichTextEditor content={content} onChange={setContent} />
                </div>

                {/* Image URL */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">
                        Cover image URL <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                        type="url"
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        placeholder="https://…"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    />
                </div>

                {/* Snapshot stats */}
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <label className="block text-[12px] font-medium text-gray-600">
                            Snapshot at time of posting <span className="text-gray-400">(optional)</span>
                        </label>
                        <button
                            type="button"
                            onClick={fetchSnapshot}
                            disabled={!counterId || fetchingSnapshot}
                            className="cursor-pointer border-none bg-transparent text-[11px] font-semibold text-amber-700 hover:underline disabled:cursor-not-allowed disabled:text-gray-300"
                        >
                            {fetchingSnapshot ? 'Fetching…' : 'Use latest known price'}
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <input
                            type="number"
                            value={priceAtPost}
                            onChange={e => setPriceAtPost(e.target.value)}
                            placeholder="Price (MWK)"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                        />
                        <input
                            type="number"
                            value={peAtPost}
                            onChange={e => setPeAtPost(e.target.value)}
                            placeholder="P/E ratio"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                        />
                        <input
                            type="number"
                            value={marketCapAtPost}
                            onChange={e => setMarketCapAtPost(e.target.value)}
                            placeholder="Market cap (MWK)"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                        />
                    </div>
                </div>

                {/* Published toggle */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
                    <div>
                        <p className="text-[13px] font-medium text-gray-900">Published</p>
                        <p className="text-[11px] text-gray-500">Unpublished analyses are saved as drafts and stay off /research.</p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={published}
                        onClick={() => setPublished(p => !p)}
                        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-none transition-colors ${published ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${published ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                        />
                    </button>
                </div>

                {error && <p className="text-[12px] text-red-600">{error}</p>}
                {success && <p className="text-[12px] text-green-600">Saved.</p>}

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="cursor-pointer rounded-lg border-none bg-amber-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                    >
                        {loading ? 'Saving…' : editingId ? 'Update analysis' : published ? 'Publish analysis' : 'Save draft'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-50"
                        >
                            Start new instead
                        </button>
                    )}
                </div>
            </div>

            {/* Recent entries */}
            <div className="mt-8">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">Recent analyses</p>
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
                                    <p className="truncate text-[12px] text-gray-900">{r.title}</p>
                                    <p className="text-[11px] text-gray-400">
                                        {counterSymbol(r.mse_counters) ?? 'General'} · {ANALYSIS_CATEGORIES.find(c => c.value === r.category)?.label ?? r.category}
                                        {' · '}
                                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                                        {' · '}
                                        <span className={r.published ? 'text-green-600' : 'text-gray-400'}>
                                            {r.published ? 'Published' : 'Draft'}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePublished(r)}
                                        className="cursor-pointer border-none bg-transparent text-[11px] text-gray-400 hover:text-gray-900"
                                    >
                                        {r.published ? 'Unpublish' : 'Publish'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(r.id)}
                                        className="cursor-pointer border-none bg-transparent text-[11px] text-gray-400 hover:text-gray-900"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(r.id)}
                                        className="cursor-pointer border-none bg-transparent text-[11px] text-gray-400 hover:text-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}