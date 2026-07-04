// lib/news/sources.ts
// Malawi business/economy RSS feeds to poll for headlines. Add more
// outlets here as you validate their feed URLs — WordPress sites like
// this typically expose /feed/ and /category/<slug>/feed/.

export const NEWS_SOURCES = [
    {
        name: 'Nyasa Times',
        feedUrl: 'https://www.nyasatimes.com/category/business/feed/',
    },
]