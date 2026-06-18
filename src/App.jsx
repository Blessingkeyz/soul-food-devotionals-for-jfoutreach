import { useState, useEffect, useCallback, useRef } from 'react'
import { getCachedPosts, setCachedPosts, fetchPosts } from './lib/api'
import PostList from './components/PostList'
import PostReader from './components/PostReader'
import NotFound from './components/NotFound'
import Toast from './components/Toast'
import './App.css'

const SITE = 'https://devotional.jfoutreach.com'

// ── Meta helpers ──────────────────────────────────────────────────
function setMetaTag(attr, val, content) {
  let el = document.querySelector(`meta[${attr}="${val}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, val); document.head.appendChild(el) }
  el.setAttribute('content', content)
}
function setLinkTag(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el) }
  el.setAttribute('href', href)
}

function updatePostMeta(post) {
  const url  = `${SITE}/${post.slug}`
  const desc = post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 155)
  const img  = post.image || `${SITE}/logo.png`
  document.title = `${post.title} | Soul Food Devotionals`
  setMetaTag('name', 'description', desc)
  setLinkTag('canonical', url)
  setMetaTag('property', 'og:type',        'article')
  setMetaTag('property', 'og:title',       post.title)
  setMetaTag('property', 'og:description', desc)
  setMetaTag('property', 'og:url',         url)
  setMetaTag('property', 'og:image',       img)
  setMetaTag('name', 'twitter:title',       post.title)
  setMetaTag('name', 'twitter:description', desc)
  setMetaTag('name', 'twitter:image',       img)
}

function resetMeta() {
  const title = 'Soul Food Devotionals | Daily Devotionals by JFOutreach'
  const desc  = 'Read daily Soul Food devotionals from JFOutreach. Faith-filled, Bible-based devotionals to nourish your spirit every day.'
  document.title = title
  setMetaTag('name', 'description', desc)
  setLinkTag('canonical', `${SITE}/`)
  setMetaTag('property', 'og:type',        'website')
  setMetaTag('property', 'og:title',       title)
  setMetaTag('property', 'og:description', desc)
  setMetaTag('property', 'og:url',         `${SITE}/`)
  setMetaTag('property', 'og:image',       `${SITE}/logo.png`)
  setMetaTag('name', 'twitter:title',       title)
  setMetaTag('name', 'twitter:description', desc)
  setMetaTag('name', 'twitter:image',       `${SITE}/logo.png`)
}

function getSlug() {
  return window.location.pathname.replace(/^\/+/, '').trim()
}

// ── App ───────────────────────────────────────────────────────────
function App() {
  const [posts, setPosts]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  const [error, setError]           = useState(null)
  const [activePost, setActivePost] = useState(null)
  const [notFound, setNotFound]     = useState(false)
  const [toast, setToast]           = useState(null)
  const [search, setSearch]         = useState('')
  const [theme, setTheme]           = useState(() => localStorage.getItem('sf_theme') || 'dark')
  const [isDesktop, setIsDesktop]   = useState(() => window.innerWidth >= 1024)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sf_theme', theme)
  }, [theme])

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const postsRef = useRef([])
  useEffect(() => { postsRef.current = posts }, [posts])

  const openBySlug = useCallback((slug, list) => {
    if (!slug) { setActivePost(null); setNotFound(false); return }
    const post = list.find(p => p.slug === slug || String(p.id) === slug)
    if (post) { setActivePost(post); setNotFound(false); updatePostMeta(post) }
    else       { setActivePost(null); setNotFound(true);  resetMeta() }
  }, [])

  // Browser back / forward
  useEffect(() => {
    const onPop = () => openBySlug(getSlug(), postsRef.current)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [openBySlug])

  const backgroundSync = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true)
    const minTimer = isManual ? new Promise(r => setTimeout(r, 1500)) : Promise.resolve()
    try {
      const fresh = await fetchPosts()
      const map   = new Map(postsRef.current.map(p => [p.id, p]))
      const changed =
        fresh.some(fp => !map.has(fp.id) || map.get(fp.id).dateModified !== fp.dateModified) ||
        postsRef.current.some(cp => !fresh.find(fp => fp.id === cp.id))
      if (changed) {
        postsRef.current = fresh
        setPosts(fresh)
        setCachedPosts(fresh)
        const slug = getSlug()
        if (slug) openBySlug(slug, fresh)
      }
    } catch { /* silent */ }
    finally {
      await minTimer
      if (isManual) setSyncing(false)
    }
  }, [openBySlug])

  useEffect(() => {
    const slug   = getSlug()
    const cached = getCachedPosts()
    if (cached) {
      postsRef.current = cached
      setPosts(cached)
      setLoading(false)
      if (slug) openBySlug(slug, cached)
      backgroundSync(false)
      return
    }
    fetchPosts()
      .then(data => {
        setCachedPosts(data)
        postsRef.current = data
        setPosts(data)
        const s = getSlug()
        if (s) openBySlug(s, data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [backgroundSync, openBySlug])

  // Silent 10-minute auto-refresh
  useEffect(() => {
    const id = setInterval(() => backgroundSync(false), 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [backgroundSync])

  const handleRefresh = useCallback(() => {
    if (!syncing) backgroundSync(true)
  }, [syncing, backgroundSync])

  const handleRead = useCallback((post) => {
    setActivePost(post)
    history.pushState({}, '', `/${post.slug}`)
    updatePostMeta(post)
  }, [])

  const handleBack = useCallback(() => {
    setActivePost(null)
    setNotFound(false)
    history.pushState({}, '', '/')
    resetMeta()
  }, [])

  const handleShare = useCallback(async (post) => {
    const url = `${SITE}/${post.slug}`
    if (navigator.share) {
      try { await navigator.share({ title: post.title, text: 'Read this devotional:', url }); return } catch {}
    }
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied to clipboard!')
    } catch {
      showToast('Could not copy link', 'error')
    }
  }, [])

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const listProps = {
    posts: filteredPosts, totalCount: posts.length,
    search, setSearch,
    loading, syncing, error,
    onRefresh: handleRefresh,
    onRead: handleRead,
    theme, onThemeToggle: toggleTheme,
    activePost,
  }
  const readerProps = {
    onBack: handleBack,
    onShare: handleShare,
    theme, onThemeToggle: toggleTheme,
  }

  return (
    <div className={`app${isDesktop ? ' app-desktop' : ''}`}>
      {isDesktop ? (
        <>
          <aside className="app-sidebar">
            <PostList {...listProps} sidebarMode />
          </aside>
          <main className="app-main">
            {activePost
              ? <PostReader {...readerProps} post={activePost} sidebarMode />
              : notFound
                ? <NotFound onBack={handleBack} />
                : <PostList {...listProps} gridOnlyMode />
            }
          </main>
        </>
      ) : (
        activePost
          ? <PostReader {...readerProps} post={activePost} />
          : notFound
            ? <NotFound onBack={handleBack} />
            : <PostList {...listProps} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default App
