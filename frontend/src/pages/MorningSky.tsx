import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Wish } from '../components/GalaxyCanvas'

export function MorningSky() {
  const [fulfilledWishes, setFulfilledWishes] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchMorningSky = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/morning-sky', { credentials: 'include' })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setFulfilledWishes(json.data as Wish[])
        } else {
          setError(json.error?.message || 'Failed to load Morning Sky')
        }
      } catch {
        setError('Network error loading Morning Sky')
      } finally {
        setLoading(false)
      }
    }

    void fetchMorningSky()
  }, [])

  return (
    <div className="page-container morning-sky-page">
      <header className="page-header morning-header">
        <div className="page-header-left">
          <Link to="/sky" className="back-link">
            ← Return to Sky
          </Link>
          <div className="morning-glow" aria-hidden="true" />
          <p className="eyebrow golden">The Morning Sky</p>
          <h1>It happened.</h1>
          <p className="page-subtitle">
            Wishes that found their answer in the waking world.
          </p>
        </div>
      </header>

      {error && <div className="error-message"><p>{error}</p></div>}

      {loading ? (
        <p className="page-loading">Waiting for dawn...</p>
      ) : fulfilledWishes.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">The morning sky is still quiet.</p>
          <p className="empty-desc">
            When a wish you made comes true, you can mark it as fulfilled in your Personal Sky.
          </p>
          <Link to="/sky" className="primary action-btn">
            Look at the Night Sky
          </Link>
        </div>
      ) : (
        <div className="wish-list">
          {fulfilledWishes.map((wish) => (
            <article key={wish.id} className="personal-wish-card morning-card">
              <div className="personal-wish-body">
                <span className="morning-sun-icon">☼</span>
                <blockquote className="personal-wish-text">“{wish.text}”</blockquote>
                {wish.fulfillmentNote && (
                  <div className="morning-note-box">
                    <span className="morning-note-label">The fulfillment:</span>
                    <p className="morning-note-text">“{wish.fulfillmentNote}”</p>
                  </div>
                )}
                <div className="personal-wish-meta">
                  <span className="category-pill golden-pill">{wish.category}</span>
                  <span>{wish.reactions} people witnessed this</span>
                  {wish.fulfilledAt && (
                    <span>• Fulfilled {new Date(wish.fulfilledAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="personal-wish-actions">
                <button
                  type="button"
                  className="soft-button"
                  onClick={() => navigate(`/sky?wishId=${wish.id}`)}
                >
                  Locate Star
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
