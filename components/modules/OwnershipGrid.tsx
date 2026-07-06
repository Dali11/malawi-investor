'use client'
import { useState } from 'react'
import type { LearnLang } from '@/lib/i18n/learn-dict'

type Variant = 'dilution' | 'rights'

// Widget-local Chichewa strings. Kept here rather than in the shared
// learn-dict.ts because these sentences are specific to this widget's
// mechanic (dilution math, rights-issue math) and aren't reused elsewhere.
const copy = {
    en: {
        totalOwnership: 'Chombo Bakery, total ownership',
        ownedByYou: 'owned by you',
        sharesOf: (yours: number, total: number) => `${yours.toLocaleString()} of ${total.toLocaleString()} shares`,
        gridAriaLabel: (yours: number, total: number, pct: string) =>
            `A grid showing you own ${yours} of ${total} total shares in Chombo Bakery, or ${pct} percent`,
        buyMore: 'Buy 5 more shares yourself',
        bakeryIssues: 'Bakery issues 20 shares to other investors',
        reset: 'Reset',
        tryBoth: "Try both buttons a few times, in any order, and watch what moves your percentage and what doesn't.",
        boughtMore: 'You bought 5 more shares directly, growing your own stake.',
        bakeryIssued: "Chombo Bakery issued 20 new shares to other investors to fund a second location. You didn't sell anything, but the pie just got bigger.",
        takeUpRights: 'Take up your rights',
        letLapse: 'Let them lapse',
        tookUp: (pct: string) =>
            `You bought your allotment, 5 new shares for the 10 you held. Your ownership stayed at ${pct}%, same as before the raise, because you participated in proportion to what you already had.`,
        lapsed: (pct: string) =>
            `You kept your 10 shares, but everyone else who took up their rights grew the total to 150. Your ownership dropped from 10% to ${pct}%, the same dilution from lesson 1, just as a choice this time.`,
    },
    ny: {
        totalOwnership: 'Chombo Bakery, umwini wonse',
        ownedByYou: 'ndi umwini wanu',
        sharesOf: (yours: number, total: number) => `ma shares ${yours.toLocaleString()} pa ${total.toLocaleString()}`,
        gridAriaLabel: (yours: number, total: number, pct: string) =>
            `Chithunzi chosonyeza kuti muli ndi shares ${yours} pa shares zonse ${total} za Chombo Bakery, kapena ${pct} peresenti`,
        buyMore: 'Gulani ma shares 5 owonjezera nokha',
        bakeryIssues: 'Bakery ikupereka ma shares 20 kwa oyika ndalama ena',
        reset: 'Yambaninso',
        tryBoth: 'Yesani mabatani onse awiri kangapo, mʼndondomeko iliyonse, ndipo onani chomwe chikusintha gawo lanu ndi chomwe sichikusintha.',
        boughtMore: 'Mwagula ma shares 5 owonjezera mwachindunji, kukulitsa gawo lanu.',
        bakeryIssued: 'Chombo Bakery yapereka ma shares 20 atsopano kwa oyika ndalama ena kuti apeze ndalama zotsegulira nthambi yachiwiri. Simunagulitse kalikonse, koma keke yakula.',
        takeUpRights: 'Tengani ufulu wanu',
        letLapse: 'Asiyeni azimirire',
        tookUp: (pct: string) =>
            `Mwagula gawo lanu, ma shares 5 atsopano pa ma 10 amene munali nawo. Umwini wanu wakhalabe pa ${pct}%, mofanana ndi nthawi isanachitike kupeza ndalamayi, chifukwa munatenga nawo mbali molingana ndi zomwe munali nazo kale.`,
        lapsed: (pct: string) =>
            `Mwasunga ma shares anu 10, koma ena onse amene anatenga ufulu wawo akulitsa chiwerengero chonse kufika pa 150. Umwini wanu wachepa kuchoka pa 10% kufika pa ${pct}%, kuchepa kwomwe kunachitika pa phunziro 1, tsopano ngati chisankho.`,
    },
} as const

/**
 * The ownership grid. Used by two lessons with the same underlying mechanic:
 *  - "dilution": what-is-a-share, lesson 1. A small repeatable sandbox: buy
 *    more shares to grow your stake, or let the bakery issue more to other
 *    investors and watch your slice shrink, same share count, smaller pie.
 *  - "rights": what-is-a-rights-issue, lesson 6. Same grid, framed as a single
 *    real decision: take up your rights (keep your percentage) or let them
 *    lapse (get diluted), so lesson 1's sandbox becomes a one-time choice.
 */
export default function OwnershipGrid({ variant = 'dilution', lang = 'en' }: { variant?: Variant; lang?: LearnLang }) {
    const t = copy[lang]
    const baseTotal = 100
    const baseYours = 10

    const [totalShares, setTotalShares] = useState(baseTotal)
    const [yourShares, setYourShares] = useState(baseYours)
    const [lastAction, setLastAction] = useState<string | null>(null)
    const [choiceMade, setChoiceMade] = useState<'took_up' | 'lapsed' | null>(null)

    const pct = (yourShares / totalShares) * 100
    const pctStr = pct.toFixed(1)
    const cols = totalShares <= 100 ? 10 : totalShares <= 200 ? 15 : 20
    const hasChanged = totalShares !== baseTotal || yourShares !== baseYours

    function buyMoreShares() {
        setYourShares(s => s + 5)
        setLastAction(t.boughtMore)
    }

    function bakeryIssuesMore() {
        setTotalShares(t2 => t2 + 20)
        setLastAction(t.bakeryIssued)
    }

    function reset() {
        setTotalShares(baseTotal)
        setYourShares(baseYours)
        setLastAction(null)
    }

    function takeUpRights() {
        // 1-for-2 rights issue: everyone's shares grow by 50%, you participate too
        setTotalShares(150)
        setYourShares(15)
        setChoiceMade('took_up')
    }

    function letRightsLapse() {
        // Everyone else takes up their rights, you don't, your share count is unchanged
        setTotalShares(150)
        setYourShares(10)
        setChoiceMade('lapsed')
    }

    return (
        <div className="rounded-xl border border-(--color-border-tertiary) bg-(--color-background-secondary) p-5 my-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                    <p className="text-xs text-(--color-text-secondary) mb-0.5">{t.totalOwnership}</p>
                    <p className="text-2xl font-medium text-(--color-text-primary)">
                        {pctStr}% <span className="text-sm text-(--color-text-secondary) font-normal">{t.ownedByYou}</span>
                    </p>
                </div>
                <p className="text-xs text-(--color-text-tertiary)">
                    {t.sharesOf(yourShares, totalShares)}
                </p>
            </div>

            {/* Grid on the left, controls + status text on the right (stacked on
                mobile) — keeps the whole interaction visible without scrolling,
                since the widget already sits in a fairly narrow column next to
                the article on desktop. */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div
                    className="grid gap-[2px] sm:w-[220px] sm:flex-shrink-0"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                    role="img"
                    aria-label={t.gridAriaLabel(yourShares, totalShares, pctStr)}
                >
                    {Array.from({ length: totalShares }).map((_, i) => (
                        <div
                            key={i}
                            className="aspect-square rounded-[2px]"
                            style={{
                                background: i < yourShares
                                    ? 'var(--color-brand)'
                                    : 'var(--color-border-secondary)',
                            }}
                        />
                    ))}
                </div>

                <div className="flex-1 min-w-0">
                    {variant === 'dilution' ? (
                        <>
                            <div className="flex flex-wrap gap-2 mb-3">
                                <button
                                    onClick={buyMoreShares}
                                    className="text-sm px-4 py-2 rounded-lg border border-(--color-border-secondary) text-(--color-text-primary) hover:bg-(--color-background-tertiary) transition-colors"
                                >
                                    {t.buyMore}
                                </button>
                                <button
                                    onClick={bakeryIssuesMore}
                                    className="text-sm px-4 py-2 rounded-lg border border-(--color-border-secondary) text-(--color-text-primary) hover:bg-(--color-background-tertiary) transition-colors"
                                >
                                    {t.bakeryIssues}
                                </button>
                                {hasChanged && (
                                    <button
                                        onClick={reset}
                                        className="text-sm px-4 py-2 rounded-lg text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors"
                                    >
                                        {t.reset}
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-(--color-text-secondary)">
                                {lastAction ?? t.tryBoth}
                            </p>
                        </>
                    ) : (
                        <>
                            {!choiceMade ? (
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={takeUpRights}
                                        className="text-sm px-4 py-2 rounded-lg border border-(--color-border-secondary) text-(--color-text-primary) hover:bg-(--color-background-tertiary) transition-colors"
                                    >
                                        {t.takeUpRights}
                                    </button>
                                    <button
                                        onClick={letRightsLapse}
                                        className="text-sm px-4 py-2 rounded-lg border border-(--color-border-secondary) text-(--color-text-primary) hover:bg-(--color-background-tertiary) transition-colors"
                                    >
                                        {t.letLapse}
                                    </button>
                                </div>
                            ) : choiceMade === 'took_up' ? (
                                <p className="text-sm text-(--color-text-secondary)">
                                    {t.tookUp(pctStr)}
                                </p>
                            ) : (
                                <p className="text-sm text-(--color-text-secondary)">
                                    {t.lapsed(pctStr)}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}