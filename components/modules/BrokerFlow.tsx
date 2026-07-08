import type { LearnLang } from '@/lib/i18n/learn-dict'

type Step = { title: string; subtitle: string; highlight?: boolean }

const copy: Record<LearnLang, { steps: Step[] }> = {
    en: {
        steps: [
            { title: 'You', subtitle: 'Want to trade' },
            { title: 'Your broker', subtitle: 'Sends the order', highlight: true },
            { title: 'MSE order book', subtitle: 'Awaits a match' },
            { title: 'Trade executed', subtitle: 'Ownership moves' },
        ],
    },
    ny: {
        steps: [
            { title: 'Inu', subtitle: 'Mukufuna kugulitsa kapena kugula' },
            { title: 'Broker wanu', subtitle: 'Amatumiza oda', highlight: true },
            { title: 'Mndandanda wa MSE', subtitle: 'Akudikirira kufanana' },
            { title: 'Malonda achitika', subtitle: 'Umwini wasintha' },
        ],
    },
}

export default function BrokerFlow({ lang = 'en' }: { lang?: LearnLang }) {
    const { steps } = copy[lang]

    return (
        <div className="rounded-xl border border-(--color-border-tertiary) bg-(--color-background-secondary) p-5 my-6">
            <div className="flex flex-wrap items-stretch justify-center gap-2">
                {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div
                            className="rounded-lg px-3 py-2.5 min-w-[110px] text-center"
                            style={{
                                background: step.highlight
                                    ? 'var(--color-background-success)'
                                    : 'var(--color-background-tertiary)',
                                border: step.highlight
                                    ? '1px solid var(--color-text-success)'
                                    : '1px solid var(--color-border-tertiary)',
                            }}
                        >
                            <p className="text-sm font-medium text-(--color-text-primary)">{step.title}</p>
                            <p className="text-xs text-(--color-text-secondary) mt-0.5">{step.subtitle}</p>
                        </div>
                        {i < steps.length - 1 && (
                            <span className="text-(--color-text-tertiary) text-lg" aria-hidden="true">→</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}