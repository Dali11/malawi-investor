// lib/news/rss.ts
// Minimal, dependency-free RSS/Atom parsing tailored to what we need:
// title, link, publish date, a short description, and a thumbnail image.
// Good enough for standard WordPress feeds (Nyasa Times etc.) — swap in a
// real XML parser later if a feed doesn't fit this shape.

export type FeedItem = {
    title: string
    link: string
    publishedAt: string | null // ISO date
    description: string | null
    imageUrl: string | null
}

function decodeEntities(str: string): string {
    return str
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
}

function tag(block: string, name: string): string | null {
    // Matches <name ...>content</name>, tolerant of attributes/namespaces
    const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i')
    const m = block.match(re)
    return m ? decodeEntities(m[1]).trim() : null
}

function attr(block: string, name: string, attrName: string): string | null {
    const re = new RegExp(`<${name}[^>]*${attrName}=["']([^"']+)["'][^>]*/?>`, 'i')
    const m = block.match(re)
    return m ? m[1] : null
}

function firstImageFromHtml(html: string | null): string | null {
    if (!html) return null
    const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
    return m ? m[1] : null
}

function stripHtml(html: string): string {
    return decodeEntities(html)
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

/** Short, non-verbatim excerpt: trims to a word boundary, never a full copy. */
export function excerpt(text: string, maxLen = 200): string {
    const clean = stripHtml(text)
    if (clean.length <= maxLen) return clean
    const cut = clean.slice(0, maxLen)
    const lastSpace = cut.lastIndexOf(' ')
    return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLen)}…`
}

export function parseRssFeed(xml: string): FeedItem[] {
    const items: FeedItem[] = []
    const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? []

    for (const block of itemBlocks) {
        const title = tag(block, 'title')
        const link = tag(block, 'link')
        if (!title || !link) continue

        const pubDate = tag(block, 'pubDate')
        const description = tag(block, 'description')
        const contentEncoded = tag(block, 'content:encoded')

        const enclosureUrl = attr(block, 'enclosure', 'url')
        const mediaContentUrl = attr(block, 'media:content', 'url')
        const imageUrl =
            enclosureUrl ?? mediaContentUrl ?? firstImageFromHtml(contentEncoded) ?? firstImageFromHtml(description)

        items.push({
            title,
            link,
            publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
            description: description ?? contentEncoded,
            imageUrl,
        })
    }

    return items
}

/**
 * Fallback for when the RSS item itself has no usable image: fetches the
 * article page and looks for the first real content photo.
 *
 * Sites like Nyasa Times set og:image to their site logo on every page
 * (a default from their SEO plugin), so that tag is useless here — we
 * instead scan the rendered HTML for the first uploaded content image
 * (WordPress media lives under /wp-content/uploads/), skipping anything
 * that looks like a logo, icon, or theme asset (those live under
 * /wp-content/themes/ or have "logo"/"icon" in the filename).
 */
export async function fetchArticleImage(articleUrl: string): Promise<string | null> {
    try {
        const res = await fetch(articleUrl, {
            headers: { 'User-Agent': 'MalawiInvestorBot/1.0 (+https://malawi-investor.vercel.app)' },
        })
        if (!res.ok) return null
        const html = await res.text()

        const imgTags = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) ?? []
        for (const imgTag of imgTags) {
            const m = imgTag.match(/src=["']([^"']+)["']/i)
            if (!m) continue
            const src = m[1]
            const lower = src.toLowerCase()
            if (lower.includes('/wp-content/uploads/') && !lower.includes('logo') && !lower.includes('icon')) {
                return src
            }
        }

        // Nothing usable in the body — fall back to og:image as a last resort.
        const ogMatch =
            html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
        return ogMatch ? ogMatch[1] : null
    } catch {
        return null
    }
}