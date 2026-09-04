import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Wish } from '../components/GalaxyCanvas'

interface PersonalSkyData {
  ownWishes: Wish[]
  savedWishes: Wish[]
  lightedWishes: Wish[]
}

export function PersonalSky() {
  const [activeTab, setActiveTab] = useState<'own' | 'saved' | 'lighted'>('own')
  const [skyData, setSkyData] = useState<PersonalSkyData>({
    ownWishes: [],
    savedWishes: [],
    lightedWishes: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fulfillingWishId, setFulfillingWishId] = useState<string | null>(null)
  const [fulfillNote, setFulfillNote] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    const loadPersonalSky = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/me/sky', { credentials: 'include' })
        const json = await res.json()
        if (active && json.success && json.data) {
          setSkyData(json.data as PersonalSkyData)
        } else if (active) {
          setError(json.error?.message || 'Failed to load personal sky')
        }
      } catch {
        if (active) setError('Network error loading personal sky')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadPersonalSky()
    return () => {
      active = false
    }
  }, [])

  const handleUnsave = async (wishId: string) => {
    try {
      const res = await fetch(`/api/wishes/${wishId}/save`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const json = await res.json()
      if (json.success) {
        setSkyData((prev) => ({
          ...prev,
          savedWishes: prev.savedWishes.filter((w) => w.id !== wishId),
        }))
      }
    } catch {
      console.error('Failed to unsave wish')
    }
  }

  const handleFulfill = async (wishId: string) => {
    try {
      const res = await fetch(`/api/wishes/${wishId}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note: fulfillNote.trim() || undefined }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        const updated = json.data as Wish
        setSkyData((prev) => ({
          ...prev,
          ownWishes: prev.ownWishes.map((w) => (w.id === updated.id ? updated : w)),
        }))
        setFulfillingWishId(null)
        setFulfillNote('')
      } else {
        setError(json.error?.message || 'Could not mark wish as fulfilled')
      }
    } catch {
      setError('Failed to fulfill wish')
    }
  }

  const currentList =
    activeTab === 'own'
      ? skyData.ownWishes
      : activeTab === 'saved'
        ? skyData.savedWishes
        : skyData.lightedWishes

  return (
    <div className="page-container personal-sky-page">
      <header className="page-header">
        <div className="page-header-left">
          <Link to="/sky" className="back-link">
            ← Return to Sky
          </Link>
          <h1>Personal Sky</h1>
          <p className="page-subtitle">Your private sanctuary among the stars.</p>
        </div>
      </header>

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'own'}
          className={`tab-btn ${activeTab === 'own' ? 'active' : ''}`}
          onClick={() => setActiveTab('own')}
        >
          My Wishes ({skyData.ownWishes.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'saved'}
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved Wishes ({skyData.savedWishes.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'lighted'}
          className={`tab-btn ${activeTab === 'lighted' ? 'active' : ''}`}
          onClick={() => setActiveTab('lighted')}
        >
          Light Sent ({skyData.lightedWishes.length})
        </button>
      </div>

      {error && <div className="error-message"><p>{error}</p></div>}

      {loading ? (
        <p className="page-loading">Gathering your stars...</p>
      ) : currentList.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">The sky is quiet here.</p>
          <p className="empty-desc">
            {activeTab === 'own' && "You haven't left a wish in the sky yet."}
            {activeTab === 'saved' && "You haven't saved any stranger's wish yet."}
            {activeTab === 'lighted' && "You haven't sent light to any wish yet."}
          </p>
          <Link to="/sky" className="primary action-btn">
            Explore the Sky
          </Link>
        </div>
      ) : (
        <div className="wish-list">
          {currentList.map((wish) => (
            <article key={wish.id} className="personal-wish-card">
              <div className="personal-wish-body">
                <blockquote className="personal-wish-text">“{wish.text}”</blockquote>
                {wish.fulfilledAt && (
                  <div className="fulfillment-badge">
                    <span className="fulfilled-tag">✦ Fulfilled</span>
                    {wish.fulfillmentNote && (
                      <p className="fulfilled-note">“{wish.fulfillmentNote}”</p>
                    )}
                  </div>
                )}
                <div className="personal-wish-meta">
                  <span className="category-pill">{wish.category}</span>
                  <span>{wish.reactions} light received</span>
                  {wish.createdAt && (
                    <span>• {new Date(wish.createdAt).toLocaleDateString()}</span>
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

                {activeTab === 'saved' && (
                  <button
                    type="button"
                    className="soft-button danger-hover"
                    onClick={() => handleUnsave(wish.id)}
                  >
                    Unsave
                  </button>
                )}

                {activeTab === 'own' && !wish.fulfilledAt && (
                  <button
                    type="button"
                    className="soft-button highlight-btn"
                    onClick={() => {
                      setFulfillingWishId(wish.id)
                      setFulfillNote('')
                    }}
                  >
                    Mark as Fulfilled
                  </button>
                )}
              </div>

              {fulfillingWishId === wish.id && (
                <div className="fulfillment-inline-form">
                  <p className="form-label">Add an optional note about what happened:</p>
                  <input
                    type="text"
                    maxLength={280}
                    placeholder="It happened. I made it through."
                    value={fulfillNote}
                    onChange={(e) => setFulfillNote(e.target.value)}
                    className="fulfill-input"
                  />
                  <div className="form-actions">
                    <button
                      type="button"
                      className="primary"
                      onClick={() => handleFulfill(wish.id)}
                    >
                      Confirm Fulfillment
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setFulfillingWishId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
