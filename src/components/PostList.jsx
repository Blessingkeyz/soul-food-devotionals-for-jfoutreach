import { useState, useEffect, useRef } from 'react'
import {
  Search, SearchX, Calendar, Clock, Sun, Moon,
  RefreshCw, AlertCircle, ChevronLeft, ChevronRight, BookOpen,
} from 'lucide-react'
import { formatDate } from '../utils/formatDate'

const PER_PAGE = 12

function readingTime(html) {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// Wraps the matched portion in a <mark>
function Highlight({ text, query }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function SkeletonCard() {
  return (
    <div className="post-card skeleton-card">
      <div className="card-img-wrap skeleton-img" />
      <div className="card-body">
        <div className="skeleton-line" style={{ width: '85%', height: 15, marginBottom: 8 }} />
        <div className="skeleton-line" style={{ width: '45%', height: 11, marginBottom: 12 }} />
        <div className="skeleton-line" style={{ width: '100%', height: 11, marginBottom: 5 }} />
        <div className="skeleton-line" style={{ width: '68%', height: 11 }} />
      </div>
    </div>
  )
}

export default function PostList({
  posts, totalCount, search, setSearch,
  loading, syncing, error, onRefresh,
  onRead, theme, onThemeToggle,
}) {
  const [page, setPage] = useState(1)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => { setPage(1) }, [search])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const showDropdown = dropdownOpen && search.trim().length > 0
  // posts is already filtered by search (from App.jsx), so we just slice
  const dropdownResults = posts.slice(0, 8)

  const handleResultClick = (post) => {
    onRead(post)
    setSearch('')
    setDropdownOpen(false)
  }

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const pagePosts  = posts.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const pageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const left  = Math.max(2, safePage - 1)
    const right = Math.min(totalPages - 1, safePage + 1)
    const pages = [1]
    if (left > 2) pages.push('…')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('…')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="page">

      <header className="page-header">
        <div className="header-brand">
          <img src="/logo.png" alt="Soul Food" className="brand-logo" />
          <div className="brand-text">
            <div className="brand-title">Soul Food</div>
            <div className="brand-sub">Daily Devotionals</div>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={onRefresh} title="Refresh" disabled={loading || syncing}>
            <RefreshCw size={16} className={syncing ? 'spin' : ''} />
          </button>
          <button className="icon-btn" onClick={onThemeToggle} title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* ── Search with dropdown ── */}
      <div className="search-section">
        <div className="search-pill-wrap" ref={searchRef}>

          <div className="search-pill">
            <Search size={15} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search devotionals…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={e => e.key === 'Escape' && setDropdownOpen(false)}
              autoComplete="off"
            />
            {search && (
              <button
                className="search-clear"
                onMouseDown={() => { setSearch(''); setDropdownOpen(false) }}
                title="Clear"
              >✕</button>
            )}
          </div>

          {showDropdown && (
            <div className="search-dropdown">
              {dropdownResults.length > 0 ? (
                dropdownResults.map(post => (
                  <button
                    key={post.id}
                    className="search-result-item"
                    onMouseDown={() => handleResultClick(post)}
                  >
                    {post.image ? (
                      <img
                        src={post.image}
                        alt=""
                        className="search-result-thumb"
                        onError={e => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <div className="search-result-thumb search-result-thumb-empty">
                        <BookOpen size={14} strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="search-result-info">
                      <span className="search-result-title">
                        <Highlight text={post.title} query={search} />
                      </span>
                      {post.datePublished && (
                        <span className="search-result-date">
                          {formatDate(post.datePublished)}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="search-no-results">
                  <SearchX size={20} strokeWidth={1.5} />
                  <span>No devotionals found for "<strong>{search}</strong>"</span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Main content ── */}
      {error ? (
        <div className="empty-state">
          <AlertCircle size={48} strokeWidth={1} />
          <p>Could not load devotionals</p>
          <span>{error}</span>
          <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={onRefresh}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>

      ) : loading ? (
        <div className="card-grid">
          {Array.from({ length: PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
        </div>

      ) : posts.length === 0 && search ? (
        <div className="empty-state">
          <SearchX size={48} strokeWidth={1} />
          <p>No devotionals found</p>
          <span>Try a different keyword.</span>
        </div>

      ) : posts.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} strokeWidth={1} />
          <p>No devotionals yet</p>
        </div>

      ) : (
        <>
          <div className="card-grid">
            {pagePosts.map(post => (
              <article key={post.id} className="post-card" onClick={() => onRead(post)}>
                <div className={`card-img-wrap ${!post.image ? 'card-img-empty' : ''}`}>
                  {post.image ? (
                    <img
                      src={post.image}
                      alt=""
                      loading="lazy"
                      onError={e => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement.classList.add('card-img-empty')
                      }}
                    />
                  ) : (
                    <BookOpen size={28} strokeWidth={1} className="card-img-icon" />
                  )}
                </div>
                <div className="card-body">
                  <h2 className="card-title">{post.title}</h2>
                  <div className="card-meta">
                    {post.datePublished && (
                      <span className="meta-chip">
                        <Calendar size={11} />
                        {formatDate(post.datePublished)}
                      </span>
                    )}
                    <span className="meta-chip">
                      <Clock size={11} />
                      {readingTime(post.content)} min read
                    </span>
                  </div>
                  <p className="card-excerpt">
                    {post.content.replace(/<[^>]+>/g, '').slice(0, 105)}…
                  </p>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
                <ChevronLeft size={16} />
              </button>
              {pageNumbers().map((n, i) =>
                n === '…'
                  ? <span key={`e-${i}`} className="page-info">…</span>
                  : <button key={n} className={`page-btn ${safePage === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
              )}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
