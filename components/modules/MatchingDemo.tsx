'use client'
import { useState } from 'react'
import type { LearnLang } from '@/lib/i18n/learn-dict'

type Order = { price: number; qty: number }
type Scenario = {
    buyers: Order[]
    sellers: Order[]
    // Which buyer/seller indices end up matched, and the outcome copy key.
    matchedBuyerIdx: number[]
    matchedSellerIdx: number[]
    outcomeKey: 'clean' | 'noMatch' | 'notEnough'
}

const scenarios: Scenario[] = [
    {
        buyers: [{ price: 47, qty: 100 }, { price: 48, qty: 200 }],
        sellers: [{ price: 48, qty: 200 }, { price: 49, qty: 150 }],
        matchedBuyerIdx: [1],
        matchedSellerIdx: [0],
        outcomeKey: 'clean',
    },
    {
        buyers: [{ price: 45, qty: 150 }, { price: 46, qty: 100 }],
        sellers: [{ price: 50, qty: 200 }, { price: 52, qty: 100 }],
        matchedBuyerIdx: [],
        matchedSellerIdx: [],
        outcomeKey: 'noMatch',
    },
    {
        buyers: [{ price: 48, qty: 100 }, { price: 48, qty: 150 }],
        sellers: [{ price: 48, qty: 100 }],
        matchedBuyerIdx: [0],
        matchedSellerIdx: [0],
        outcomeKey: 'notEnough',
    },
]

// Widget-local Chichewa strings, same convention as OwnershipGrid.tsx —
// specific to this widget's scenarios rather than shared page chrome.
const copy = {
    en: {
        note: 'NBM order book, illustrative prices, not live data',
        buyers: 'BUYERS',
        sellers: 'SELLERS',
        scenario: (i: number) => `Scenario ${i}`,
        runMatching: 'Run matching',
        sharesLabel: (n: number) => `${n} shares`,
        outcomes: {
            clean: 'The MK48 buyer and MK48 seller matched and traded 200 shares. The MK47 buyer and MK49 seller are still waiting, no one on the other side has agreed to their price.',
            noMatch: "Nobody matched. Every buyer wants a lower price than any seller will accept. Both sides could still want NBM, and no trade happens today until one side moves.",
            notEnough: "Both buyers offered MK48, but only 100 shares were on sale at that price. The first buyer in the queue got filled in full, the second buyer at the same price got nothing this round, price agreement alone doesn't guarantee you get shares.",
        },
    },
    ny: {
        note: 'Mndandanda wa malonda a NBM, mitengo yowonetsera kokha, si deta yeniyeni ya nthawi ino',
        buyers: 'OGULA',
        sellers: 'OGULITSA',
        scenario: (i: number) => `Chochitika ${i}`,
        runMatching: 'Fananizani',
        sharesLabel: (n: number) => `ma shares ${n}`,
        outcomes: {
            clean: 'Wogula pa MK48 ndi wogulitsa pa MK48 anafanana ndipo anagulitsana ma shares 200. Wogula pa MK47 ndi wogulitsa pa MK49 akadali kudikirira, palibe wina mbali inayo amene wavomera mtengo wawo.',
            noMatch: 'Palibe amene anafanana. Ogula onse akufuna mtengo wotsika kusiyana ndi umene ogulitsa angavomereze. Mbali zonse zitha kufunikirabe NBM, koma palibe malonda amene achitika lero mpaka mbali imodzi isinthe mtengo wake.',
            notEnough: 'Ogula onse awiri anapereka MK48, koma ma shares 100 okha ndiwo anali pa mtengowo. Wogula woyamba pamzere anapeza ma shares ake onse, wogula wachiwiri pa mtengo womwewo sanapeze kalikonse nthawi ino, kuvomerezana mtengo kokha sikutsimikizira kuti mupeza ma shares.',
        },
    },
} as const

function OrderRow({ order, matched }: { order: Order; matched: boolean }) {
    return (
        <div
            className="rounded-lg px-3 py-2 text-sm flex justify-between transition-colors"
            style={{
                background: matched ? 'var(--color-background-success)' : 'var(--color-background-secondary)',
                border: matched ? '1px solid var(--color-text-success)' : '1px solid var(--color-border-tertiary)',
            }}
        >
            <span className="text-(--color-text-primary)">MK{order.price}</span>
            <span className="text-(--color-text-secondary)">{order.qty}</span>
        </div>
    )
}

export default function MatchingDemo({ lang = 'en' }: { lang?: LearnLang }) {
    const t = copy[lang]
    const [scenarioIdx, setScenarioIdx] = useState(0)
    const [ran, setRan] = useState(false)

    const scenario = scenarios[scenarioIdx]

    function selectScenario(i: number) {
        setScenarioIdx(i)
        setRan(false)
    }

    return (
        <div className="rounded-xl border border-(--color-border-tertiary) bg-(--color-background-secondary) p-5 my-6">
            <p className="text-xs text-(--color-text-tertiary) text-center mb-4">{t.note}</p>

            <div className="flex gap-2 justify-center mb-4 flex-wrap">
                {scenarios.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => selectScenario(i)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${i === scenarioIdx
                            ? 'border-amber-500 text-amber-600 font-medium'
                            : 'border-(--color-border-tertiary) text-(--color-text-secondary) hover:bg-(--color-background-tertiary)'
                            }`}
                    >
                        {t.scenario(i + 1)}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <p className="text-xs font-medium text-(--color-text-success) mb-2">{t.buyers}</p>
                    <div className="space-y-1.5">
                        {scenario.buyers.map((o, i) => (
                            <OrderRow key={i} order={o} matched={ran && scenario.matchedBuyerIdx.includes(i)} />
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-xs font-medium text-(--color-text-danger) mb-2">{t.sellers}</p>
                    <div className="space-y-1.5">
                        {scenario.sellers.map((o, i) => (
                            <OrderRow key={i} order={o} matched={ran && scenario.matchedSellerIdx.includes(i)} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="text-center mb-3">
                <button
                    onClick={() => setRan(true)}
                    disabled={ran}
                    className="text-sm px-4 py-2 rounded-lg border border-(--color-border-secondary) text-(--color-text-primary) hover:bg-(--color-background-tertiary) transition-colors disabled:opacity-50"
                >
                    {t.runMatching}
                </button>
            </div>

            {ran && (
                <p className="text-sm text-(--color-text-secondary) text-center">
                    {t.outcomes[scenario.outcomeKey]}
                </p>
            )}
        </div>
    )
}