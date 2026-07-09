'use client'
import { useState, useEffect, useRef } from 'react'
import type { LearnLang } from '@/lib/i18n/learn-dict'

export type FrozenStock = {
    symbol: string
    price: number
    prevClose: number
    dayHigh: number
    dayLow: number
    volume: number
    sharesOutstanding: number
}

const copy = {
    en: {
        statusLive: 'live, updates every 2s',
        statusPaused: 'paused',
        counterLabel: 'Counter',
        symbolNote: 'The ticker symbol, a short code identifying this counter on the exchange',
        lastPriceNote: "Last price, and how far that is from yesterday's close",
        dayRange: 'Day range',
        dayRangeNote: 'lowest and highest price traded today',
        volume: 'Volume',
        volumeNote: 'shares actually traded today',
        marketCap: 'Market cap',
        pause: 'Pause the ticker',
        resume: 'Resume the ticker',
    },
    ny: {
        statusLive: 'pakadali pano, zikusintha pa masekondi 2',
        statusPaused: 'yaimitsidwa',
        counterLabel: 'Counter',
        symbolNote: 'Chizindikiro cha counter, dzina lalifupi loyimira kampani iyi pa msika',
        lastPriceNote: 'Mtengo womaliza, ndi kusiyana kwake ndi kutseka kwa dzulo',
        dayRange: 'Mtengo wa lero',
        dayRangeNote: 'mtengo wotsika kwambiri ndi wapamwamba kwambiri lero',
        volume: 'Ma-share ogulitsidwa',
        volumeNote: 'ma-share amene agulitsidwadi lero',
        marketCap: 'Mtengo wonse wa kampani',
        pause: 'Imitsani ma tikala',
        resume: 'Yambitsaninso',
    },
} as const

const SHARES_OUTSTANDING = 40_000_000
const PREV_CLOSE = 9950
const START_PRICE = 9995.98

function fmtMK(n: number) {
    return 'MK' + Math.round(n).toLocaleString()
}

export default function TickerDemo({
    lang = 'en',
    onFrozen,
}: {
    lang?: LearnLang
    onFrozen?: (stock: FrozenStock) => void
}) {
    const t = copy[lang]
    const [price, setPrice] = useState(START_PRICE)
    const [dayHigh, setDayHigh] = useState(START_PRICE)
    const [dayLow, setDayLow] = useState(START_PRICE)
    const [volume, setVolume] = useState(8200)
    const [frozen, setFrozen] = useState(false)
    const frozenRef = useRef(frozen)
    frozenRef.current = frozen

    useEffect(() => {
        const interval = setInterval(() => {
            if (frozenRef.current) return
            setPrice(prev => {
                const move = (Math.random() - 0.5) * 20
                const next = Math.max(9500, prev + move)
                setDayHigh(h => Math.max(h, next))
                setDayLow(l => Math.min(l, next))
                return next
            })
            setVolume(v => v + Math.round(Math.random() * 300))
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    function togglePause() {
        const next = !frozen
        setFrozen(next)
        if (next) {
            onFrozen?.({
                symbol: 'NBM',
                price,
                prevClose: PREV_CLOSE,
                dayHigh,
                dayLow,
                volume,
                sharesOutstanding: SHARES_OUTSTANDING,
            })
        }
    }

    const change = price - PREV_CLOSE
    const pct = (change / PREV_CLOSE) * 100
    const up = change >= 0
    const cap = price * SHARES_OUTSTANDING

    return (
        <div className="rounded-xl border border-(--color-border-tertiary) bg-(--color-background-secondary) p-5 my-6">
            <div className="flex justify-between items-baseline mb-1">
                <div>
                    <p className="text-xs text-(--color-text-secondary) mb-0.5">{t.counterLabel}</p>
                    <p className="text-base font-medium text-(--color-text-primary)">NBM</p>
                </div>
                <p className="text-xs text-(--color-text-tertiary)">{frozen ? t.statusPaused : t.statusLive}</p>
            </div>
            <p className="text-[11px] text-(--color-text-tertiary) mb-4">{t.symbolNote}</p>

            <div className="flex items-baseline gap-2.5 mb-0.5">
                <p className="text-2xl font-medium text-(--color-text-primary)">{fmtMK(price)}</p>
                <p className="text-sm font-medium" style={{ color: up ? 'var(--color-text-success)' : 'var(--color-text-danger)' }}>
                    {up ? '+' : ''}{change.toFixed(1)} ({up ? '+' : ''}{pct.toFixed(2)}%)
                </p>
            </div>
            <p className="text-xs text-(--color-text-tertiary) mb-4">{t.lastPriceNote}</p>

            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-(--color-background-tertiary) rounded-lg p-3">
                    <p className="text-xs text-(--color-text-secondary) mb-1">{t.dayRange}</p>
                    <p className="text-sm font-medium text-(--color-text-primary) mb-1">{fmtMK(dayLow)} – {fmtMK(dayHigh)}</p>
                    <p className="text-[11px] text-(--color-text-tertiary)">{t.dayRangeNote}</p>
                </div>
                <div className="bg-(--color-background-tertiary) rounded-lg p-3">
                    <p className="text-xs text-(--color-text-secondary) mb-1">{t.volume}</p>
                    <p className="text-sm font-medium text-(--color-text-primary) mb-1">{Math.round(volume).toLocaleString()}</p>
                    <p className="text-[11px] text-(--color-text-tertiary)">{t.volumeNote}</p>
                </div>
                <div className="bg-(--color-background-tertiary) rounded-lg p-3">
                    <p className="text-xs text-(--color-text-secondary) mb-1">{t.marketCap}</p>
                    <p className="text-sm font-medium text-(--color-text-primary) mb-1">MK{(cap / 1e9).toFixed(2)}B</p>
                    <p className="text-[11px] text-(--color-text-tertiary)">{fmtMK(price)} × {(SHARES_OUTSTANDING / 1e6)}M</p>
                </div>
            </div>

            <div className="text-center">
                <button
                    onClick={togglePause}
                    className="text-sm px-4 py-2 rounded-lg border border-(--color-border-secondary) text-(--color-text-primary) hover:bg-(--color-background-tertiary) transition-colors"
                >
                    {frozen ? t.resume : t.pause}
                </button>
            </div>
        </div>
    )
}