import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Wish } from '../components/GalaxyCanvas'

interface Constellation {
  id: string
  name: string
  slug: string
  description: string | null
  wishCount: number
}

export function Constellations() {
  const { slug } = useParams<{ slug?: string }>()
  const [constellations, setConstellations] = useState<Constellation[]>([])
  const [rawCategoryWishes, setRawCategoryWishes] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Load constellation overview
  useEffect(() => {
    let active = true
    const fetchConstellations = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/constellations', { credentials: 'include' })
        const json = await res.json()
        if (active && json.success && Array.isArray(json.data)) {
          setConstellations(json.data as Constellation[])
        }
      } catch {
        if (active) setError('Failed to load constellations')
      } finally {
        if (active) setLoading(false)
      }
    }
    void fetchConstellations()
    return () => {
      active = false
    }
  }, [])

  // If a slug is specified, load wishes for that constellation
  useEffect(() => {
    if (!slug) return
    let active = true

    const fetchCategoryWishes = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/constellations/${slug}`, { credentials: 'include' })
        const json = await res.json()
        if (active && json.success && Array.isArray(json.data)) {
          setRawCategoryWishes(json.data as Wish[])
        }
      } catch {
        if (active) setError('Failed to load constellation wishes')
      } finally {
        if (active) setLoading(false)
      }
    }
    void fetchCategoryWishes()
    return () => {
      active = false
    }
  }, [slug])

  const categoryWishes = slug ? rawCategoryWishes : []

  const selectedConstellation = constellations.find((c) => c.slug === slug)

  return (
    <div className="page-container constellations-page">
      <header className="page-header">
        <div className="page-header-left">
          <Link to="/sky" className="back-link">
            ← Return to Sky
          </Link>
          <p className="eyebrow">Shared Patterns</p>
          <h1>{selectedConstellation ? selectedConstellation.name : 'Constellations'}</h1>
          <p className="page-subtitle">
            {selectedConstellation?.description ??
              'Strangers connected across the universe by common human threads.'}
          </p>
        </div>
        {selectedConstellation && (
          <div className="page-header-actions">
            <button
              type="button"
              className="primary"
              onClick={() => navigate(`/sky?category=${selectedConstellation.slug}`)}
            >
              Explore this Sky Region
            </button>
          </div>
        )}
      </header>

      {error && <div className="error-message"><p>{error}</p></div>}

      {/* Constellation category selector chips */}
      <div className="constellation-chips" role="navigation" aria-label="Constellation selection">
        <Link
          to="/constellations"
          className={`chip ${!slug ? 'active' : ''}`}
        >
          All Constellations
        </Link>
        {constellations.map((c) => (
          <Link
            key={c.slug}
            to={`/constellations/${c.slug}`}
            className={`chip ${slug === c.slug ? 'active' : ''}`}
          >
            {c.name} ({c.wishCount})
          </Link>
        ))}
      </div>

      {loading ? (
        <p className="page-loading">Tracing the stars...</p>
      ) : !slug ? (
        /* Constellation Overview Grid */
        <div className="constellations-grid">
          {constellations.map((c) => (
            <article
              key={c.slug}
              className="constellation-card"
              onClick={() => navigate(`/constellations/${c.slug}`)}
            >
              <span className="constellation-mark">✦</span>
              <h2>{c.name}</h2>
              <p className="constellation-desc">{c.description}</p>
              <div className="constellation-footer">
                <span className="constellation-count">{c.wishCount} stars connected</span>
                <span className="constellation-arrow">→</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* Constellation Wishes List */
        <div className="wish-list">
          {categoryWishes.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">No stars in this constellation yet.</p>
              <p className="empty-desc">Leave a wish under {selectedConstellation?.name} to be its first star.</p>
            </div>
          ) : (
            categoryWishes.map((wish) => (
              <article key={wish.id} className="personal-wish-card">
                <div className="personal-wish-body">
                  <blockquote className="personal-wish-text">“{wish.text}”</blockquote>
                  <div className="personal-wish-meta">
                    <span className="category-pill">{wish.category}</span>
                    <span>{wish.reactions} people sent light</span>
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
            ))
          )}
        </div>
      )}
    </div>
  )
}
