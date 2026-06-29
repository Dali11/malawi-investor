// lib/marketsNav.ts
// Single source of truth for the "Markets" dropdown / mobile accordion.
// Add a new market section by adding one entry here — the desktop
// dropdown and mobile nav both read from this list.

export type MarketsIconKey =
    | 'overview'
    | 'stocks'
    | 'bonds'
    | 'indices'
    | 'corporate-actions'
    | 'ipos'
    | 'screeners'
    | 'calendar'

export type MarketsLink = {
    label: string
    href: string
    description: string
    icon: MarketsIconKey
}

export const marketsLinks: MarketsLink[] = [
    {
        label: 'Market Overview',
        href: '/markets',
        description: "Today's snapshot across the MSE",
        icon: 'overview',
    },
    {
        label: 'Stocks',
        href: '/markets/stocks',
        description: 'All listed companies & live prices',
        icon: 'stocks',
    },
    {
        label: 'Bonds',
        href: '/markets/bonds',
        description: 'Treasury & corporate bond listings',
        icon: 'bonds',
    },
    {
        label: 'Indices',
        href: '/markets/indices',
        description: 'MASI & sector performance',
        icon: 'indices',
    },
    {
        label: 'Corporate Actions',
        href: '/markets/corporate-actions',
        description: 'Dividends, splits & rights issues',
        icon: 'corporate-actions',
    },
    {
        label: 'IPOs',
        href: '/markets/ipos',
        description: 'Upcoming & past listings',
        icon: 'ipos',
    },
    {
        label: 'Screeners',
        href: '/markets/screeners',
        description: 'Filter stocks by your own criteria',
        icon: 'screeners',
    },
    {
        label: 'Calendar',
        href: '/markets/calendar',
        description: 'AGMs, earnings & key dates',
        icon: 'calendar',
    },
]
