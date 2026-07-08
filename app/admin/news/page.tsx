// app/admin/news/page.tsx
// Add short news headlines to the /news feed. Distinct from the
// full analysis editor at /admin (which authors long-form Research
// pieces) — this is quick headline + source link entry.

'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NewsAdminPage() {
    const [counters, setCounters] = useState<any[]>([])
    const [recent, setRecent] = useState<any[]>([])

    const [counterId, setCounterId] = useState('')
    const [category, setCategory] = useState('Market News')
    const [headline, setHeadline] = useState('')
    const [summary, setSummary] = useState('')
    const [sourceName, setSourceName] = useState('')
    const [sourceUrl, setSourceUrl] = useState('')
    const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 10))
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [uploadingImage, setUploadingImage] = useState(false)

    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    function loadRecent() {
        supabase
            .from('news_items')
            .select('id, headline, source_name, published_at, image_url, category, mse_counters(symbol)')
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

    function handleImageSelect(file: File | null) {
        setImageFile(file)
        setImagePreview(file ? URL.createObjectURL(file) : null)
    }

    function resetForm() {
        setCounterId('')
        setCategory('Market News')
        setHeadline('')
        setSummary('')
        setSourceName('')
        setSourceUrl('')
        setPublishedAt(new Date().toISOString().slice(0, 10))
        handleImageSelect(null)
    }

    async function uploadImage(): Promise<string | null> {
        if (!imageFile) return null
        const ext = imageFile.name.split('.').pop()
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { error: uploadError } = await supabase.storage
            .from('news-images')
            .upload(path, imageFile, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('news-images').getPublicUrl(path)
        return data.publicUrl
    }

    async function handleSubmit() {
        if (!headline.trim()) {
            setError('Headline is required')
            return
        }
        setLoading(true); setError(null); setSuccess(false)
        try {
            let imageUrl: string | null = null
            if (imageFile) {
                setUploadingImage(true)
                imageUrl = await uploadImage()
                setUploadingImage(false)
            }
            const { error: insertError } = await supabase.from('news_items').insert({
                counter_id: counterId ? parseInt(counterId) : null,
                category,
                headline: headline.trim(),
                summary: summary.trim() || null,
                source_name: sourceName.trim() || null,
                source_url: sourceUrl.trim() || null,
                published_at: publishedAt,
                image_url: imageUrl,
            })
            if (insertError) throw insertError
            setSuccess(true)
            resetForm()
            loadRecent()
        } catch (e: any) {
            setError(e.message ?? 'Failed to save')
        } finally {
            setLoading(false)
            setUploadingImage(false)
        }
    }

    const [fetching, setFetching] = useState(false)
    const [fetchResult, setFetchResult] = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null)

    async function handleFetchLatest() {
        setFetching(true)
        setFetchResult(null)
        try {
            const res = await fetch('/api/admin/fetch-news', { method: 'POST' })
            const data = await res.json()
            setFetchResult(data)
            loadRecent()
        } catch (e: any) {
            setFetchResult({ inserted: 0, skipped: 0, errors: [e.message ?? 'Request failed'] })
        } finally {
            setFetching(false)
        }
    }

    const [refreshingImages, setRefreshingImages] = useState(false)
    const [refreshResult, setRefreshResult] = useState<{ updated: number; unchanged: number; errors: string[] } | null>(null)

    async function handleRefreshImages() {
        setRefreshingImages(true)
        setRefreshResult(null)
        try {
            const res = await fetch('/api/admin/refresh-news-images', { method: 'POST' })
            const data = await res.json()
            setRefreshResult(data)
            loadRecent()
        } catch (e: any) {
            setRefreshResult({ updated: 0, unchanged: 0, errors: [e.message ?? 'Request failed'] })
        } finally {
            setRefreshingImages(false)
        }
    }

    const [recategorizing, setRecategorizing] = useState(false)
    const [recategorizeResult, setRecategorizeResult] = useState<{ updated: number; unchanged: number; errors: string[] } | null>(null)

    async function handleRecategorize() {
        setRecategorizing(true)
        setRecategorizeResult(null)
        try {
            const res = await fetch('/api/admin/recategorize-news', { method: 'POST' })
            const data = await res.json()
            setRecategorizeResult(data)
            loadRecent()
        } catch (e: any) {
            setRecategorizeResult({ updated: 0, unchanged: 0, errors: [e.message ?? 'Request failed'] })
        } finally {
            setRecategorizing(false)
        }
    }

    async function handleDelete(id: number) {
        await supabase.from('news_items').delete().eq('id', id)
        loadRecent()
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="text-[20px] font-semibold text-gray-900">News</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">
                Add a short headline to the News feed. For full write-ups, use the Research editor instead.
            </p>

            <div className="mt-5 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                <div>
                    <p className="text-[13px] font-medium text-gray-900">Fetch latest headlines</p>
                    <p className="text-[12px] text-gray-500">Pulls fresh Malawi business/economy headlines from configured sources.</p>
                </div>
                <button
                    type="button"
                    onClick={handleFetchLatest}
                    disabled={fetching}
                    className="cursor-pointer rounded-lg border-none bg-gray-900 px-3.5 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                >
                    {fetching ? 'Fetching…' : 'Fetch latest'}
                </button>
            </div>
            {fetchResult && (
                <p className="mt-2 text-[12px] text-gray-500">
                    {fetchResult.inserted} added, {fetchResult.skipped} already in the feed
                    {fetchResult.errors.length > 0 && ` · ${fetchResult.errors.join('; ')}`}
                </p>
            )}

            <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                <div>
                    <p className="text-[13px] font-medium text-gray-900">Refresh images</p>
                    <p className="text-[12px] text-gray-500">Re-derives the article photo for rows stuck with a logo or no image.</p>
                </div>
                <button
                    type="button"
                    onClick={handleRefreshImages}
                    disabled={refreshingImages}
                    className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-[13px] font-medium text-gray-900 disabled:opacity-50"
                >
                    {refreshingImages ? 'Refreshing…' : 'Refresh images'}
                </button>
            </div>
            {refreshResult && (
                <p className="mt-2 text-[12px] text-gray-500">
                    {refreshResult.updated} updated, {refreshResult.unchanged} left as-is
                    {refreshResult.errors.length > 0 && ` · ${refreshResult.errors.join('; ')}`}
                </p>
            )}

            <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                <div>
                    <p className="text-[13px] font-medium text-gray-900">Recategorize</p>
                    <p className="text-[12px] text-gray-500">Re-sorts existing headlines using the latest keyword rules.</p>
                </div>
                <button
                    type="button"
                    onClick={handleRecategorize}
                    disabled={recategorizing}
                    className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-[13px] font-medium text-gray-900 disabled:opacity-50"
                >
                    {recategorizing ? 'Recategorizing…' : 'Recategorize'}
                </button>
            </div>
            {recategorizeResult && (
                <p className="mt-2 text-[12px] text-gray-500">
                    {recategorizeResult.updated} updated, {recategorizeResult.unchanged} left as-is
                    {recategorizeResult.errors.length > 0 && ` · ${recategorizeResult.errors.join('; ')}`}
                </p>
            )}

            <div className="mt-6 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5">
                {/* Headline */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Headline</label>
                    <input
                        type="text"
                        value={headline}
                        onChange={e => setHeadline(e.target.value)}
                        placeholder="e.g. NBM declares interim dividend of MK 4.50 per share"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    />
                </div>

                {/* Image */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">
                        Photo <span className="text-gray-400">(optional)</span>
                    </label>
                    {imagePreview ? (
                        <div className="flex items-center gap-3">
                            <img src={imagePreview} alt="" className="h-16 w-16 rounded-lg object-cover" />
                            <button
                                type="button"
                                onClick={() => handleImageSelect(null)}
                                className="cursor-pointer border-none bg-transparent text-[12px] text-gray-500 hover:text-red-600"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageSelect(e.target.files?.[0] ?? null)}
                            className="block w-full text-[12px] text-gray-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                        />
                    )}
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

                {/* Category */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Category</label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    >
                        <option>Market News</option>
                        <option>Company News</option>
                        <option>Stocks</option>
                        <option>Bonds</option>
                        <option>Economy</option>
                        <option>IPOs & Corporate Actions</option>
                    </select>
                </div>

                {/* Summary */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Summary (optional)</label>
                    <textarea
                        value={summary}
                        onChange={e => setSummary(e.target.value)}
                        rows={2}
                        placeholder="One or two sentences of context"
                        className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                    />
                </div>

                {/* Source name / URL */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1 block text-[12px] font-medium text-gray-600">Source name</label>
                        <input
                            type="text"
                            value={sourceName}
                            onChange={e => setSourceName(e.target.value)}
                            placeholder="e.g. MSE, Nyasa Times"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[12px] font-medium text-gray-600">Source URL</label>
                        <input
                            type="url"
                            value={sourceUrl}
                            onChange={e => setSourceUrl(e.target.value)}
                            placeholder="https://…"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"
                        />
                    </div>
                </div>

                {/* Published date */}
                <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Published date</label>
                    <input
                        type="date"
                        value={publishedAt}
                        onChange={e => setPublishedAt(e.target.value)}
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
                    {loading ? (uploadingImage ? 'Uploading photo…' : 'Saving…') : 'Add headline'}
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
                                <div className="flex min-w-0 items-center gap-2.5">
                                    {r.image_url && (
                                        <img src={r.image_url} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="truncate text-[12px] text-gray-900">{r.headline}</p>
                                        <p className="text-[11px] text-gray-400">
                                            {r.category ?? 'Uncategorized'} · {r.mse_counters?.symbol ?? 'General'} · {r.source_name ?? 'No source'} · {r.published_at}
                                        </p>
                                    </div>
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