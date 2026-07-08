import type { LearnLang } from '@/lib/i18n/learn-dict'

type Step = { title: string; subtitle: string; highlight?: boolean }

const copy: Record<LearnLang, { steps: Step[]; directoryTitle: string; directoryNote: string }> = {
    en: {
        steps: [
            { title: 'You', subtitle: 'Want to trade' },
            { title: 'Your broker', subtitle: 'Sends the order', highlight: true },
            { title: 'MSE order book', subtitle: 'Awaits a match' },
            { title: 'Trade executed', subtitle: 'Ownership moves' },
        ],
        directoryTitle: 'Licensed MSE member brokers',
        directoryNote: 'As listed by the MSE, current as of March 2026. Contact them directly to confirm details before opening an account.',
    },
    ny: {
        steps: [
            { title: 'Inu', subtitle: 'Mukufuna kugulitsa kapena kugula' },
            { title: 'Broker wanu', subtitle: 'Amatumiza oda', highlight: true },
            { title: 'Mndandanda wa MSE', subtitle: 'Akudikirira kufanana' },
            { title: 'Malonda achitika', subtitle: 'Umwini wasintha' },
        ],
        directoryTitle: 'Ma broker ovomerezeka a MSE',
        directoryNote: 'Monga zafotokozedwa ndi MSE, zolondola pofika Marichi 2026. Lumikizanani nawo mwachindunji kuti mutsimikizire zambiri musanatsegule akaunti.',
    },
}

const brokers = [
    {
        name: 'Cedar Capital Limited',
        address: '4th Floor, Livingstone Towers, P.O Box 3340, Blantyre',
        phone: '+265 (0)111 831 395',
        website: 'https://cedarcapital.mw/',
    },
    {
        name: 'Continental Capital Limited',
        address: 'P.O Box 1444, Blantyre',
        phone: '+265 111 828 363',
        website: 'https://www.continentalcapital.mw',
    },
    {
        name: 'Stockbrokers Malawi Limited',
        address: 'P.O Box 31180, Blantyre 3',
        phone: '+265 (0)111 836 213',
        website: 'https://www.stockbrokersmw.com/',
    },
]

export default function BrokerFlow({ lang = 'en' }: { lang?: LearnLang }) {
    const t = copy[lang]

    return (
        <div className="rounded-xl border border-(--color-border-tertiary) bg-(--color-background-secondary) p-5 my-6">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch justify-center gap-2 mb-6">
                {t.steps.map((step, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-center gap-2">
                        <div
                            className="rounded-lg px-3 py-2.5 w-full sm:w-auto sm:min-w-[110px] text-center"
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
                        {i < t.steps.length - 1 && (
                            <span className="text-(--color-text-tertiary) text-lg rotate-90 sm:rotate-0" aria-hidden="true">→</span>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-5 border-t border-(--color-border-tertiary)">
                <p className="text-sm font-medium text-(--color-text-primary) mb-1">{t.directoryTitle}</p>
                <p className="text-xs text-(--color-text-tertiary) mb-4">{t.directoryNote}</p>
                <div className="space-y-3">
                    {brokers.map((b) => (
                        <div key={b.name} className="rounded-lg bg-(--color-background-tertiary) p-3">
                            <p className="text-sm font-medium text-(--color-text-primary)">{b.name}</p>
                            <p className="text-xs text-(--color-text-secondary) mt-0.5">{b.address}</p>
                            <div className="flex flex-wrap gap-x-4 mt-1.5 text-xs">
                                <span className="text-(--color-text-secondary)">{b.phone}</span>
                                <a href={b.website} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                                    {b.website.replace(/^https?:\/\//, '')}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}