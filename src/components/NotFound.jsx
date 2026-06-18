import { ArrowLeft } from 'lucide-react'

export default function NotFound({ onBack }) {
  return (
    <div className="not-found-pane">
      <div className="not-found-inner">
        <div className="not-found-code">404</div>
        <h2 className="not-found-title">Devotional Not Found</h2>
        <p className="not-found-sub">
          This link may be broken or the devotional may have been removed.
        </p>
        <button className="btn btn-ghost not-found-btn" onClick={onBack}>
          <ArrowLeft size={15} />
          Back to Devotionals
        </button>
      </div>
    </div>
  )
}
