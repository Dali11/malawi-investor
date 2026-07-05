'use client'
import { useState } from 'react'

type Variant = 'dilution' | 'rights'

/**
 * The ownership grid. Used by two lessons with the same underlying mechanic:
 *  - "dilution": what-is-a-share, lesson 1. A small repeatable sandbox: buy
 *    more shares to grow your stake, or let the bakery issue more to other
 *    investors and watch your slice shrink, same share count, smaller pie.
 *  - "rights": what-is-a-rights-issue, lesson 6. Same grid, framed as a single
 *    real decision: take up your rights (keep your percentage) or let them
 *    lapse (get diluted), so lesson 1's sandbox becomes a one-time choice.
 */
export default function OwnershipGrid({ variant = 'dilution' }: { variant?: Variant }) {
    const baseTotal = 100
    const baseYours = 10

    const [totalShares, setTotalShares] = useState(baseTotal)
    const [yourShares, setYourShares] = useState(baseYours)
    const [lastAction, setLastAction] = useState<string | null>(null)
    const [choiceMade, setChoiceMade] = useState<'took_up' | 'lapsed' | null>(null)

    const pct = (yourShares / totalShares) * 100
    const cols = totalShares <= 100 ? 10 : totalShares <= 200 ? 15 : 20
    const hasChanged = totalShares !== baseTotal || yourShares !== baseYours

    function buyMoreShares() {
        setYourShares(s => s + 5)
        setLastAction('You bought 5 more shares directly, growing your own stake.')
    }

    function bakeryIssuesMore() {
        setTotalShares(t => t + 20)
        setLastAction('Chombo Bakery issued 20 new shares to other investors to fund a second location. You didn\'t sell anything, but the pie just got bigger.')
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
                    <p className="text-xs text-(--color-text-secondary) mb-0.5">Chombo Bakery, total ownership</p>
                    <p className="text-2xl font-medium text-(--color-text-primary)">
                        {pct.toFixed(1)}% <span className="text-sm text-(--color-text-secondary) font-normal">owned by you</span>
                    </p>
                </div>
                <p className="text-xs text-(--color-text-tertiary)">
                    {yourShares.toLocaleString()} of {totalShares.toLocaleString()} shares
                </p>
            </div>

            <div
                className="grid gap-[2px] mb-4"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                role="img"
                aria-label={`A grid showing you own ${yourShares} of ${totalShares} total shares in Chombo Bakery, or ${pct.toFixed(1)} percent`}
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

            {variant === 'dilution' ? (
                <>
                    <div className="flex flex-wrap gap-2 mb-3">
                        <button
                            onClick={buyMoreShares}
                            className="text-sm px-4 py-2 rounded-lg border border-(--color-border-secondary) text-(--color-text-primary) hover:bg-(--color-background-tertiary) transition-colors"
                        >
                            Buy 5 more shares yourself
                        </button>
                        <button
                            onClick={bakeryIssuesMore}
                            className="text-sm px-4 py-2 rounded-lg border border-(--color-border-secondary) text-(--color-text-primary) hover:bg-(--color-background-tertiary) transition-colors"
                        >
                            Bakery issues 20 shares to other investors
                        </button>
                        {hasChanged && (
                            <button
                                onClick={reset}
                                className="text-sm px-4 py-2 rounded-lg text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-(--color-text-secondary)">
                        {lastAction ?? 'Try both buttons a few times, in any order, and watch what moves your percentage and what doesn\'t.'}
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
                                Take up your rights
                            </button>
                            <button
                                onClick={letRightsLapse}
                                className="text-sm px-4 py-2 rounded-lg border border-(--color-border-secondary) text-(--color-text-primary) hover:bg-(--color-background-tertiary) transition-colors"
                            >
                                Let them lapse
                            </button>
                        </div>
                    ) : choiceMade === 'took_up' ? (
                        <p className="text-sm text-(--color-text-secondary)">
                            You bought your allotment, 5 new shares for the 10 you held. Your ownership stayed at {pct.toFixed(1)}%,
                            same as before the raise, because you participated in proportion to what you already had.
                        </p>
                    ) : (
                        <p className="text-sm text-(--color-text-secondary)">
                            You kept your 10 shares, but everyone else who took up their rights grew the total to 150.
                            Your ownership dropped from 10% to {pct.toFixed(1)}%, the same dilution from lesson 1, just as a choice this time.
                        </p>
                    )}
                </>
            )}
        </div>
    )
}