// components/watchlist/PriceAlertButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Alert = {
    id: string
    target_price: number
    direction: 'above' | 'below'
}

export function PriceAlertButton({
    counterId,
    symbol,
    isLoggedIn,
    initialAlerts,
}: {
    counterId: number
    symbol: string
    isLoggedIn: boolean
    initialAlerts: Alert[]
}) {
    const router = useRouter()
    const supabase = createClient()
    const [open, setOpen] = useState(false)
    const [direction, setDirection] = useState<'above' | 'below'>('above')
    const [targetPrice, setTargetPrice] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function requireLogin() {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
    }

    async function submit() {
        const price = Number(targetPrice)
        if (!targetPrice || Number.isNaN(price) || price <= 0) {
            setError('Enter a valid target price.')
            return
        }
        setError(null)
        setSubmitting(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setSubmitting(false); requireLogin(); return }

        await supabase.from('price_alerts').insert({
            user_id: user.id,
            counter_id: counterId,
            target_price: price,
            direction,
        })

        setSubmitting(false)
        setTargetPrice('')
        setOpen(false)
        router.refresh()
    }

    async function cancelAlert(alertId: string) {
        await supabase.from('price_alerts').update({ status: 'cancelled' }).eq('id', alertId)
        router.refresh()
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => (isLoggedIn ? setOpen((o) => !o) : requireLogin())}
                className="flex items-center gap-1.5 rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) px-3 py-1.5 text-[12px] font-medium text-(--color-text-secondary) hover:text-(--color-text-primary)"
            >
                <Bell size={13} aria-hidden="true" />
                Set alert
            </button>

            {initialAlerts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {initialAlerts.map((a) => (
                        <span
                            key={a.id}
                            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
                            style={{ background: 'var(--color-background-warning)', color: 'var(--color-text-warning)' }}
                        >
                            Notify when {a.direction} MK {a.target_price.toFixed(2)}
                            <button
                                type="button"
                                onClick={() => cancelAlert(a.id)}
                                aria-label="Cancel alert"
                                className="border-none bg-transparent p-0 text-current"
                            >
                                <X size={11} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {open && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) p-3">
                    <span className="text-[12px] text-(--color-text-secondary)">Notify me when {symbol} is</span>
                    <select
                        value={direction}
                        onChange={(e) => setDirection(e.target.value as 'above' | 'below')}
                        className="rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-2 py-1 text-[12px] text-(--color-text-primary)"
                    >
                        <option value="above">at or above</option>
                        <option value="below">at or below</option>
                    </select>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder="Target price"
                        className="w-28 rounded-(--border-radius-md) border-[0.5px] border-(--color-border-secondary) bg-(--color-background-primary) px-2 py-1 text-[12px] text-(--color-text-primary)"
                    />
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={submit}
                        className="rounded-(--border-radius-md) bg-(--color-text-primary) px-3 py-1 text-[12px] font-medium text-(--color-background-primary) disabled:opacity-50"
                    >
                        {submitting ? 'Saving…' : 'Save'}
                    </button>
                    {error && <p className="w-full text-[11px] text-(--color-text-danger)">{error}</p>}
                </div>
            )}
        </div>
    )
}