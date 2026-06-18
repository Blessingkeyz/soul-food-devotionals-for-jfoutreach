import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, Clock, Sun, Moon, Share2, Check } from 'lucide-react'
import { formatDate } from '../utils/formatDate'

function readingTime(html) {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function highlightAuthor(html) {
  return html.replace(
    /APOSTLE\s+SYLVESTER\s+ONYEMALECHI/gi,
    '<strong class="author-name">$&</strong>'
  )
}

export default function PostReader({ post, onBack, onShare, theme, onThemeToggle, sidebarMode = false }) {
  const [shared, setShared] = useState(false)
  const mins = readingTime(post.content)

  // Scroll to top when post changes
  useEffect(() => {
    const mainEl = document.querySelector('.app-main')
    if (mainEl) mainEl.scrollTop = 0
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [post.id])

  const handleShare = async () => {
    await onShare(post)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  return (
    <div className="page reader-page">

      <header className="page-header">
        <div className="header-brand">
          {!sidebarMode && (
            <button className="icon-btn" onClick={onBack} title="Back to list"><ArrowLeft size={18} /></button>
          )}
          <img src="/logo.png" alt="Soul Food" className="brand-logo brand-logo-mobile" />
          <div className="brand-text">
            <div className="brand-org">JESUS FAMILY OUTREACH</div>
            <div className="brand-title">Soul Food Devotionals</div>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`icon-btn${shared ? ' icon-btn-success' : ''}`}
            onClick={handleShare}
            title="Share this devotional"
          >
            {shared ? <Check size={16} /> : <Share2 size={16} />}
          </button>
          <button className="icon-btn" onClick={onThemeToggle} title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className="reader-body">

        {post.image && (
          <div className="reader-hero-wrap">
            <img
              src={post.image}
              alt={post.title}
              className="reader-hero-img"
              onError={e => { e.currentTarget.parentElement.style.display = 'none' }}
            />
            <div className="reader-hero-fade" />
          </div>
        )}

        <div className="reader-content">

          <div className="reader-meta">
            {post.datePublished && (
              <span className="meta-chip">
                <Calendar size={12} />
                {formatDate(post.datePublished)}
              </span>
            )}
            <span className="meta-chip">
              <Clock size={12} />
              {mins} min read
            </span>
          </div>

          <h1 className="reader-title">{post.title}</h1>

          <div className="reader-divider" />

          <div
            className="reader-prose"
            dangerouslySetInnerHTML={{ __html: highlightAuthor(post.content) }}
          />

        </div>
      </div>
    </div>
  )
}
