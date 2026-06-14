import { useState, useEffect, useCallback, useRef } from 'react'
import { getCachedPosts, setCachedPosts, fetchPosts } from './lib/api'
import PostList from './components/PostList'
import PostReader from './components/PostReader'
import Toast from './components/Toast'
import './App.css'

function App() {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError]     = useState(null)
  const [view, setView]       = useState('list')
  const [activePost, setActivePost] = useState(null)
  const [toast, setToast]     = useState(null)
  const [search, setSearch]   = useState('')
  const [theme, setTheme]     = useState(() => localStorage.getItem('sf_theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sf_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const showToast = (message, type = 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const postsRef = useRef([])
  useEffect(() => { postsRef.current = posts }, [posts])

  const backgroundSync = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true)
    const minTimer = isManual ? new Promise(r => setTimeout(r, 1500)) : Promise.resolve()
    try {
      const fresh = await fetchPosts()
      const currentMap = new Map(postsRef.current.map(p => [p.id, p]))
      const hasChanges =
        fresh.some(fp => !currentMap.has(fp.id) || currentMap.get(fp.id).dateModified !== fp.dateModified) ||
        postsRef.current.some(cp => !fresh.find(fp => fp.id === cp.id))
      if (hasChanges) {
        postsRef.current = fresh
        setPosts(fresh)
        setCachedPosts(fresh)
      }
    } catch {
      // silent background sync failure
    } finally {
      await minTimer
      if (isManual) setSyncing(false)
    }
  }, [])

  useEffect(() => {
    const cached = getCachedPosts()
    if (cached) {
      postsRef.current = cached
      setPosts(cached)
      setLoading(false)
      backgroundSync(false)
      return
    }
    setLoading(true)
    fetchPosts()
      .then(data => {
        setCachedPosts(data)
        postsRef.current = data
        setPosts(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [backgroundSync])

  // Silent 10-minute auto-refresh
  useEffect(() => {
    const id = setInterval(() => backgroundSync(false), 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [backgroundSync])

  const handleRefresh = useCallback(() => {
    if (!syncing) backgroundSync(true)
  }, [syncing, backgroundSync])

  const handleRead = (post) => { setActivePost(post); setView('reader') }
  const handleBack = () => { setView('list'); setActivePost(null) }

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="app">
      {view === 'reader' && activePost ? (
        <PostReader
          post={activePost}
          onBack={handleBack}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
      ) : (
        <PostList
          posts={filteredPosts}
          totalCount={posts.length}
          search={search}
          setSearch={setSearch}
          loading={loading}
          syncing={syncing}
          error={error}
          onRefresh={handleRefresh}
          onRead={handleRead}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default App
