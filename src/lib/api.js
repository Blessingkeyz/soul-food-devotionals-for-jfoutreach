const WP    = 'https://www.jfoutreach.com/wp-json/wp/v2'
const CAT   = 5
const FIELDS = 'id,title,content,excerpt,date,modified,slug,link,jetpack_featured_media_url'
const CACHE_KEY = 'sf_posts'
const TTL   = 5 * 60 * 1000

function firstSentence(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim()
  const m = text.match(/[^.!?]{3,}[.!?]/)
  return m ? m[0].trim() : text.slice(0, 80)
}

function normalize(p) {
  const rawTitle = (p.title?.rendered || '').trim()
  return {
    id:            p.id,
    title:         rawTitle || firstSentence(p.content?.rendered || ''),
    content:       p.content?.rendered || '',
    excerpt:       p.excerpt?.rendered || '',
    image:         p.jetpack_featured_media_url || '',
    datePublished: p.date     || '',
    dateModified:  p.modified || '',
    slug:          p.slug,
    link:          p.link,
  }
}

export function getCachedPosts() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > TTL) { sessionStorage.removeItem(CACHE_KEY); return null }
    return data
  } catch { return null }
}

export function setCachedPosts(posts) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: posts, ts: Date.now() })) } catch {}
}

export async function fetchPosts() {
  const url = `${WP}/posts?categories=${CAT}&per_page=100&status=publish&_fields=${FIELDS}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load devotionals (${res.status})`)
  return (await res.json()).map(normalize)
}
