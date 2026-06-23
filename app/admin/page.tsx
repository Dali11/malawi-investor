'use client'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
    const [counters, setCounters] = useState<any[]>([])
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [counterId, setCounterId] = useState('')
    const [price, setPrice] = useState('')
    const [pe, setPe] = useState('')
    const [marketCap, setMarketCap] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastSaved, setLastSaved] = useState<string | null>(null)
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
    const [hasBodyText, setHasBodyText] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const editorRef = useRef<HTMLDivElement>(null)
    const savedSelectionRef = useRef<Range | null>(null)
    const supabase = createClient()

    useEffect(() => {
        supabase.from('mse_counters').select('*').order('symbol').then(({ data }) => {
            if (data) setCounters(data)
        })
    }, [])

    function updateActiveFormats() {
        const newFormats = new Set<string>()
        if (document.queryCommandState('bold')) newFormats.add('bold')
        if (document.queryCommandState('italic')) newFormats.add('italic')
        if (document.queryCommandState('underline')) newFormats.add('underline')
        if (document.queryCommandState('strikeThrough')) newFormats.add('strike')
        if (document.queryCommandState('insertUnorderedList')) newFormats.add('ul')
        if (document.queryCommandState('insertOrderedList')) newFormats.add('ol')
        if (document.queryCommandState('justifyLeft')) newFormats.add('alignLeft')
        if (document.queryCommandState('justifyCenter')) newFormats.add('alignCenter')
        if (document.queryCommandState('justifyRight')) newFormats.add('alignRight')
        setActiveFormats(newFormats)
    }

    function saveSelection() {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
            savedSelectionRef.current = sel.getRangeAt(0).cloneRange()
        }
    }

    function restoreSelection() {
        const sel = window.getSelection()
        if (sel && savedSelectionRef.current) {
            sel.removeAllRanges()
            sel.addRange(savedSelectionRef.current)
        }
    }

    const exec = useCallback((command: string, value?: string) => {
        restoreSelection()
        editorRef.current?.focus()
        document.execCommand(command, false, value ?? undefined)
        updateActiveFormats()
        syncContent()
    }, [])

    function applyHeading(tag: 'h1' | 'h2' | 'h3') {
        restoreSelection()
        editorRef.current?.focus()
        // Toggle off if same heading is active, else apply
        document.execCommand('formatBlock', false, tag)
        updateActiveFormats()
        syncContent()
    }

    function applyKeyInsight() {
        restoreSelection()
        editorRef.current?.focus()
        document.execCommand('formatBlock', false, 'blockquote')
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
            const node = sel.getRangeAt(0).commonAncestorContainer
            const bq = (node as Element).closest?.('blockquote') ??
                (node.parentElement as Element)?.closest?.('blockquote')
            if (bq) bq.setAttribute('data-insight', 'true')
        }
        syncContent()
    }

    const wordCount = useMemo(() => {
        const text = editorRef.current?.innerText ?? content.replace(/<[^>]+>/g, ' ')
        return text.trim().split(/\s+/).filter(Boolean).length
    }, [content])

    const readTime = useMemo(() => Math.max(1, Math.ceil(wordCount / 200)), [wordCount])

    const selectedCounter = useMemo(
        () => counters.find(c => String(c.id) === counterId) ?? null,
        [counters, counterId]
    )

    const checklist = useMemo(() => [
        { label: 'Title added', ok: title.trim().length > 0, warn: false },
        { label: 'Counter selected', ok: !!counterId, warn: false },
        { label: 'Price snapshot filled', ok: !!price, warn: false },
        { label: imageFile ? 'Cover image added' : 'No cover image', ok: !!imageFile, warn: !imageFile },
        {
            label: wordCount >= 100 ? `${wordCount} words — good length` : `${wordCount} words — too short`,
            ok: wordCount >= 100,
            warn: wordCount > 0 && wordCount < 100,
        },
    ], [title, counterId, price, imageFile, wordCount])

    function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { setError('Please select an image file'); return }
        if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return }
        setError(null)
        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
    }

    function clearImage() {
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    async function uploadImage(): Promise<string | null> {
        if (!imageFile) return null
        const ext = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage.from('analysis-images').upload(fileName, imageFile)
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`)
        const { data } = supabase.storage.from('analysis-images').getPublicUrl(fileName)
        return data.publicUrl
    }

    async function handlePost() {
        const plainText = editorRef.current?.innerText ?? ''
        if (!title || !plainText.trim()) return
        setLoading(true); setError(null)
        try {
            const imageUrl = await uploadImage()
            const { error: insertError } = await supabase.from('analyses').insert({
                title, content,
                counter_id: counterId ? parseInt(counterId) : null,
                price_at_post: price ? parseFloat(price) : null,
                pe_at_post: pe ? parseFloat(pe) : null,
                market_cap_at_post: marketCap ? parseFloat(marketCap) : null,
                image_url: imageUrl, published: true,
            })
            if (insertError) throw new Error(insertError.message)
            setSuccess(true); setLastSaved('just now')
            setTitle(''); setContent(''); setCounterId(''); setPrice(''); setPe(''); setMarketCap('')
            clearImage()
            if (editorRef.current) editorRef.current.innerHTML = ''
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong')
        } finally { setLoading(false) }
    }

    async function handleSaveDraft() {
        if (!title && !content) return
        setLoading(true); setError(null)
        try {
            await supabase.from('analyses').insert({
                title, content,
                counter_id: counterId ? parseInt(counterId) : null,
                price_at_post: price ? parseFloat(price) : null,
                pe_at_post: pe ? parseFloat(pe) : null,
                market_cap_at_post: marketCap ? parseFloat(marketCap) : null,
                published: false,
            })
            setLastSaved('just now')
        } catch (err: any) {
            setError(err.message ?? 'Save failed')
        } finally { setLoading(false) }
    }

    // syncContent: update both content HTML and the hasBodyText gate
    function syncContent() {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML
            const text = editorRef.current.innerText ?? ''
            setContent(html)
            setHasBodyText(text.trim().length > 0)
        }
    }
    const canPublish = !loading && title.trim().length > 0 && hasBodyText

    // Reusable toolbar button
    function TbBtn({
        label, onClick, isActive = false, className = '', title: tip,
    }: {
        label: React.ReactNode
        onClick: () => void
        isActive?: boolean
        className?: string
        title?: string
    }) {
        return (
            <button
                type="button"
                title={tip}
                onMouseDown={e => { e.preventDefault(); saveSelection() }}
                onClick={onClick}
                className={[
                    'px-1.5 py-1 rounded text-[13px] border-none cursor-pointer leading-none transition-colors select-none',
                    isActive
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-gray-500 bg-transparent hover:bg-white hover:text-gray-800',
                    className,
                ].join(' ')}
            >
                {label}
            </button>
        )
    }

    function Sep() {
        return <div className="w-px h-[18px] bg-gray-200 mx-0.5 shrink-0" />
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6">
            <style>{`
                .bbn-editor:empty:before {
                    content: attr(data-placeholder);
                    color: #d1d5db;
                    pointer-events: none;
                    display: block;
                }
                .bbn-editor { outline: none; }
                .bbn-editor h1 { font-size: 1.7em; font-weight: 800; margin: 0.9em 0 0.3em; line-height: 1.2; }
                .bbn-editor h2 { font-size: 1.3em; font-weight: 700; margin: 0.75em 0 0.25em; }
                .bbn-editor h3 { font-size: 1.1em; font-weight: 600; margin: 0.6em 0 0.2em; }
                .bbn-editor ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
                .bbn-editor ol { list-style: decimal; padding-left: 1.4em; margin: 0.4em 0; }
                .bbn-editor blockquote[data-insight] {
                    border-left: 3px solid #d97706;
                    background: #fffbeb;
                    padding: 10px 14px;
                    margin: 0.6em 0;
                    border-radius: 0 6px 6px 0;
                    font-style: normal;
                    color: #92400e;
                    font-size: 0.94em;
                }
                .bbn-editor blockquote:not([data-insight]) {
                    border-left: 3px solid #e5e7eb;
                    padding-left: 12px;
                    color: #6b7280;
                    font-style: italic;
                    margin: 0.4em 0;
                }
                .bbn-editor a { color: #1d4ed8; text-decoration: underline; }
                .bbn-editor mark { background: #fef08a; padding: 0 2px; border-radius: 2px; }
                .bbn-editor p { margin: 0.3em 0; }
            `}</style>

            {/* ── CMS Shell: fixed height, no overflow-hidden so inner scroll works ── */}
            <div
                className="w-full max-w-5xl rounded-xl border border-gray-200 bg-white"
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 280px',
                    gridTemplateRows: 'auto 1fr',
                    height: 'calc(100vh - 48px)',
                    overflow: 'hidden',
                }}
            >
                {/* ── Top Bar (row 1, spans both cols) ── */}
                <div
                    className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white z-10"
                    style={{ gridColumn: '1 / -1', gridRow: '1' }}
                >
                    <div className="flex items-center gap-2.5">
                        <span className="text-[13px] font-bold text-gray-900">
                            <span className="text-amber-700">BBN</span> Admin
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            {success ? 'Published' : 'Draft'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {error && (
                            <span className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-1">
                                {error}
                            </span>
                        )}
                        {success && (
                            <span className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1">
                                Published successfully
                            </span>
                        )}
                        <button type="button" onClick={handleSaveDraft} disabled={loading}
                            className="text-[12px] px-3 py-1 rounded-md border border-gray-200 text-gray-600 bg-transparent hover:bg-gray-50 transition-colors disabled:opacity-40">
                            Save draft
                        </button>
                        <button type="button" onClick={handlePost} disabled={!canPublish}
                            className="text-[12px] px-3.5 py-1 rounded-md font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 transition-colors disabled:opacity-40">
                            {loading ? (imageFile ? 'Uploading…' : 'Publishing…') : 'Publish'}
                        </button>
                    </div>
                </div>

                {/* ── Left column: sticky header + scrollable body ── */}
                <div
                    className="border-r border-gray-200 flex flex-col overflow-hidden"
                    style={{ gridColumn: '1', gridRow: '2' }}
                >
                    {/* Sticky top: title + meta + toolbar */}
                    <div className="px-6 pt-5 pb-3 border-b border-gray-100 bg-white shrink-0">
                        {/* Title */}
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Article headline…"
                            className="w-full border-none outline-none text-[22px] font-bold text-gray-900 bg-transparent leading-snug placeholder-gray-300 mb-1.5"
                        />
                        {/* Meta */}
                        <div className="text-[11px] text-gray-400 mb-3">
                            {wordCount > 0
                                ? `${wordCount} words · ~${readTime} min read${lastSaved ? ` · last saved ${lastSaved}` : ''}`
                                : 'Start writing to see word count'}
                        </div>

                        {/* ── Toolbar ── */}
                        <div className="flex items-center gap-0 flex-wrap px-1.5 py-1 border border-gray-200 rounded-lg bg-gray-50">

                            {/* Text style */}
                            <TbBtn label={<b>B</b>} onClick={() => exec('bold')} isActive={activeFormats.has('bold')} title="Bold (Ctrl+B)" />
                            <TbBtn label={<i>I</i>} onClick={() => exec('italic')} isActive={activeFormats.has('italic')} title="Italic (Ctrl+I)" />
                            <TbBtn label={<u>U</u>} onClick={() => exec('underline')} isActive={activeFormats.has('underline')} title="Underline (Ctrl+U)" />
                            <TbBtn label={<s>S</s>} onClick={() => exec('strikeThrough')} isActive={activeFormats.has('strike')} title="Strikethrough" />

                            <Sep />

                            {/* Headings */}
                            <TbBtn label="H1" onClick={() => applyHeading('h1')} className="font-bold text-[12px]" title="Heading 1" />
                            <TbBtn label="H2" onClick={() => applyHeading('h2')} className="font-semibold text-[12px]" title="Heading 2" />
                            <TbBtn label="H3" onClick={() => applyHeading('h3')} className="font-medium text-[12px]" title="Heading 3" />

                            <Sep />

                            {/* Lists */}
                            <TbBtn label="≡" onClick={() => exec('insertUnorderedList')} isActive={activeFormats.has('ul')} title="Bullet list" />
                            <TbBtn label="1." onClick={() => exec('insertOrderedList')} isActive={activeFormats.has('ol')} title="Numbered list" />

                            <Sep />

                            {/* Alignment */}
                            <TbBtn label="⬛︎L" onClick={() => exec('justifyLeft')} isActive={activeFormats.has('alignLeft')} className="text-[11px]" title="Align left" />
                            <TbBtn label="⬛︎C" onClick={() => exec('justifyCenter')} isActive={activeFormats.has('alignCenter')} className="text-[11px]" title="Align center" />
                            <TbBtn label="⬛︎R" onClick={() => exec('justifyRight')} isActive={activeFormats.has('alignRight')} className="text-[11px]" title="Align right" />

                            <Sep />

                            {/* Indent */}
                            <TbBtn label="→" onClick={() => exec('indent')} title="Indent" className="text-[14px]" />
                            <TbBtn label="←" onClick={() => exec('outdent')} title="Outdent" className="text-[14px]" />

                            <Sep />

                            {/* Block formats */}
                            <TbBtn label='"' onClick={() => exec('formatBlock', 'blockquote')} title="Block quote" className="text-[16px]" />

                            {/* Link */}
                            <button
                                type="button"
                                title="Insert link"
                                onMouseDown={e => { e.preventDefault(); saveSelection() }}
                                onClick={() => {
                                    const url = window.prompt('Enter URL:')
                                    if (url) exec('createLink', url)
                                }}
                                className="px-1.5 py-1 rounded text-[13px] text-gray-500 bg-transparent hover:bg-white hover:text-gray-800 border-none cursor-pointer leading-none transition-colors"
                            >
                                🔗
                            </button>

                            {/* Highlight */}
                            <button
                                type="button"
                                title="Highlight"
                                onMouseDown={e => { e.preventDefault(); saveSelection() }}
                                onClick={() => exec('hiliteColor', '#fef08a')}
                                className="px-1.5 py-1 rounded text-[13px] text-gray-500 bg-transparent hover:bg-white hover:text-gray-800 border-none cursor-pointer leading-none transition-colors"
                            >
                                🖊
                            </button>

                            {/* Clear formatting */}
                            <button
                                type="button"
                                title="Clear formatting"
                                onMouseDown={e => { e.preventDefault(); saveSelection() }}
                                onClick={() => exec('removeFormat')}
                                className="px-1.5 py-1 rounded text-[13px] text-gray-400 bg-transparent hover:bg-white hover:text-red-500 border-none cursor-pointer leading-none transition-colors"
                            >
                                ✕
                            </button>

                            <Sep />

                            {/* Key insight */}
                            <button
                                type="button"
                                title="Key insight callout"
                                onMouseDown={e => { e.preventDefault(); saveSelection() }}
                                onClick={applyKeyInsight}
                                className="px-2 py-1 rounded text-[11px] font-medium text-amber-700 bg-transparent hover:bg-amber-50 border-none cursor-pointer leading-none transition-colors"
                            >
                                ★ Key insight
                            </button>
                        </div>
                    </div>

                    {/* Scrollable editor area — fills remaining height, editor grows with content */}
                    <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2">
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            data-placeholder="Start writing your analysis…"
                            className="bbn-editor w-full min-h-full border border-gray-200 rounded-lg px-4 py-3 text-[14px] leading-[1.85] text-gray-900 bg-white"
                            style={{ minHeight: '100%' }}
                            onInput={syncContent}
                            onKeyUp={updateActiveFormats}
                            onMouseUp={updateActiveFormats}
                            onSelect={updateActiveFormats}
                            onBlur={saveSelection}
                        />
                    </div>

                    {/* Pinned image upload footer — always visible below editor, never overlaps it */}
                    <div className="px-6 py-3 border-t border-gray-100 bg-white shrink-0">
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                        {imagePreview ? (
                            <div className="relative">
                                <img src={imagePreview} alt="Cover preview" className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                                <button type="button" onClick={clearImage}
                                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 flex items-center justify-center"
                                    aria-label="Remove image">×</button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => fileInputRef.current?.click()}
                                className="w-full border border-dashed border-gray-200 rounded-lg py-3 text-[12px] text-gray-400 bg-gray-50 hover:border-amber-400 hover:text-amber-700 transition-colors text-center cursor-pointer">
                                <span className="block text-lg mb-0.5">↑</span>
                                Cover image · JPG or PNG · max 5MB
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Right: Sidebar (row 2, scrollable independently) ── */}
                <div
                    className="bg-gray-50 p-4 flex flex-col gap-5 overflow-y-auto"
                    style={{ gridColumn: '2', gridRow: '2' }}
                >
                    {/* Counter */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Counter</p>
                        {selectedCounter && (
                            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 rounded-full px-2.5 py-1 text-[11px] font-bold mb-2">
                                🏦 {selectedCounter.symbol} — {selectedCounter.company_name}
                            </div>
                        )}
                        <select value={counterId} onChange={e => setCounterId(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white text-gray-900 outline-none focus:border-amber-400">
                            <option value="">General commentary (no specific stock)</option>
                            {counters.map(c => (
                                <option key={c.id} value={c.id}>{c.symbol} — {c.company_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Price snapshot */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Price snapshot</p>
                        <div className="mb-2.5">
                            <label className="text-[12px] text-gray-500 block mb-1">Price (MK)</label>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 4584"
                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white text-gray-900 outline-none focus:border-amber-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[12px] text-gray-500 block mb-1">P/E ratio</label>
                                <input type="number" value={pe} onChange={e => setPe(e.target.value)} placeholder="7.85"
                                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white text-gray-900 outline-none focus:border-amber-400" />
                            </div>
                            <div>
                                <label className="text-[12px] text-gray-500 block mb-1">Market cap (B)</label>
                                <input type="number" value={marketCap} onChange={e => setMarketCap(e.target.value)} placeholder="2.1"
                                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white text-gray-900 outline-none focus:border-amber-400" />
                            </div>
                        </div>
                    </div>

                    {/* Card preview */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Card preview</p>
                        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                            <div className="h-20 bg-[#0c1f3d] flex items-center justify-center">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <svg viewBox="0 0 80 30" width="60" fill="none">
                                        <polyline points="0,25 15,18 30,20 50,8 65,13 80,3"
                                            stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                )}
                            </div>
                            <div className="p-2.5">
                                {selectedCounter && (
                                    <span className="inline-block bg-blue-50 text-blue-700 rounded-full px-1.5 py-px text-[9px] font-bold mb-1">
                                        {selectedCounter.symbol}
                                    </span>
                                )}
                                <p className="text-[12px] font-semibold text-gray-900 leading-snug mb-1">
                                    {title || 'Article headline will appear here'}
                                </p>
                                <p className="text-[10px] text-gray-400">Bena Nkhoma · just now</p>
                            </div>
                        </div>
                    </div>

                    {/* Pre-publish checklist */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Pre-publish checklist</p>
                        <div className="flex flex-col gap-1.5">
                            {checklist.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-[12px] text-gray-600">
                                    {item.ok
                                        ? <span className="text-green-500 text-[13px]">✓</span>
                                        : item.warn
                                            ? <span className="text-amber-500 text-[13px]">⚠</span>
                                            : <span className="text-gray-300 text-[13px]">○</span>
                                    }
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}