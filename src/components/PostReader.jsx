import { ArrowLeft, Calendar, Clock, Sun, Moon } from 'lucide-react'
import { formatDate } from '../utils/formatDate'

function readingTime(html) {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export default function PostReader({ post, onBack, theme, onThemeToggle }) {
  const mins = readingTime(post.content)

  return (
    <div className="page reader-page">

      <header className="page-header">
        <button className="icon-btn" onClick={onBack} title="Back to list">
          <ArrowLeft size={18} />
        </button>
        <div className="header-brand" style={{ flex: 1, justifyContent: 'center' }}>
          <img src="/logo.png" alt="Soul Food" className="brand-logo" />
        </div>
        <button className="icon-btn" onClick={onThemeToggle} title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
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
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

        </div>
      </div>
    </div>
  )
}
