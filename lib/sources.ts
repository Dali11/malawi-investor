// lib/news/sources.ts
// Malawi business/economy RSS feeds to poll for headlines. Add more
// outlets here as you validate their feed URLs — WordPress sites like
// this typically expose /feed/ and /category/<slug>/feed/.

// lib/news/sources.ts
// Malawi news RSS feeds to poll for headlines.
//
// `isBusinessCategoryFeed: true` means the feed URL itself is already
// scoped to a business/economy category (e.g. Nyasa Times) — every item
// from it is kept. Otherwise the feed is a general firehose (politics,
// sports, entertainment, business all mixed together) and every item
// gets passed through isBusinessRelevant() in the fetch route before
// being kept.

export const NEWS_SOURCES = [
    {
        name: 'Nyasa Times',
        feedUrl: 'https://www.nyasatimes.com/category/business/feed/',
        isBusinessCategoryFeed: true,
    },
    {
        name: 'BusinessMalawi',
        feedUrl: 'https://businessmalawi.com/feed',
        isBusinessCategoryFeed: true,
    },
    {
        name: 'Malawi Nation',
        feedUrl: 'https://mwnation.com/feed',
        isBusinessCategoryFeed: false,
    },
    // {
    //     name: 'Malawi24',
    //     feedUrl: 'https://malawi24.com/feed',
    //     isBusinessCategoryFeed: false,
    // },
    {
        // Unverified feed path — confirmed to have *a* feed, but the exact
        // URL wasn't available to check. Standard WordPress guess; watch
        // the fetch-result errors for an HTTP 404 and adjust if needed.
        name: 'Zodiak',
        feedUrl: 'https://www.zodiakmalawi.com/feed',
        isBusinessCategoryFeed: false,
    },
    {
        // Fully unverified — no RSS feed link found anywhere for MBC.
        // This is a guess based on their WordPress-style URL structure
        // (/category/news/). Remove this entry if it 404s.
        name: 'MBC',
        feedUrl: 'https://mbc.mw/category/news/feed/',
        isBusinessCategoryFeed: false,
    },
]