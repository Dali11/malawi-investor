// lib/news/categorize.ts
// Best-effort keyword match to sort an auto-fetched headline into a
// category, since RSS feeds don't tell us that themselves. Not
// perfect — anything mis-tagged can still be fixed by hand in
// /admin/news. Checked in order: the first matching category wins.

type CategoryRule = { category: string; keywords: string[] }

const RULES: CategoryRule[] = [
    {
        category: 'Bonds',
        keywords: ['treasury bond', 'treasury note', 'bond yield', 'bond auction', 'government bond', ' bond ', 'bonds market'],
    },
    {
        category: 'IPOs & Corporate Actions',
        keywords: ['ipo', 'initial public offering', 'rights issue', 'agm', 'annual general meeting', 'dividend', 'listing', 'delisting', 'buyback', 'share split'],
    },
    {
        category: 'Economy',
        keywords: ['inflation', 'gdp', 'kwacha', 'forex', 'foreign exchange', 'reserve bank', 'rbm', 'interest rate', 'monetary policy', 'exports', 'imports', 'trade deficit', 'economic growth', 'budget'],
    },
    {
        category: 'Stocks',
        keywords: ['share price', 'stock price', 'shares', 'counter', 'msesi', 'masi', 'stock market', 'trading session'],
    },
]

export function categorizeHeadline(headline: string, summary?: string | null): string {
    const text = `${headline} ${summary ?? ''}`.toLowerCase()

    for (const rule of RULES) {
        if (rule.keywords.some((k) => text.includes(k))) {
            return rule.category
        }
    }

    // Fallback: company-specific news (a named company doing something)
    // reads differently from generic market commentary, but without NLP
    // this is hard to tell apart reliably — default to Company News since
    // most Nyasa Times business-desk headlines are about a specific firm.
    return 'Company News'
}

const RELEVANCE_KEYWORDS = [
    // Finance/markets terms specific enough to rarely false-positive
    'kwacha', 'dividend', 'ipo', 'inflation', 'gdp', 'forex', 'foreign exchange',
    'insurer', 'insurance', 'plc', 'agm', 'earnings', 'profit', 'revenue',
    'conglomerate', 'mse', 'rbm', 'reserve bank', 'exchange rate', 'monetary policy',
    'interest rate', 'tax', 'budget', 'mining', 'listed on', 'delisted', 'delisting',
    'shareholder', 'share price', 'stock price', 'share capital', 'stock exchange',
    'stock market', 'money market', 'capital markets', 'treasury bond', 'treasury note',
    'bond yield', 'bond auction', 'government bond', 'trade deficit', 'trade balance',
    'foreign trade', 'export earnings', 'import bill', 'buyback', 'rights issue',
    'financial results', 'annual report', 'quarterly results', 'loan facility',
    'credit rating', 'foreign direct investment',
]

/**
 * Used only for general (non-business-scoped) feed sources — filters
 * out politics/sports/entertainment noise so only finance-flavored
 * headlines make it into news_items.
 */
export function isBusinessRelevant(headline: string, summary?: string | null): boolean {
    const text = `${headline} ${summary ?? ''}`.toLowerCase()
    return RELEVANCE_KEYWORDS.some((k) => text.includes(k))
}