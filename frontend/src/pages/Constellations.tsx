import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Wish } from '../components/GalaxyCanvas'
import { localizeDigits, useCategoryLabel, useLanguage } from '../i18n'

interface Constellation {
  id: string
  name: string
  slug: string
  description: string | null
  wishCount: number
}

export function Constellations() {
  const { t, language } = useLanguage()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const categoryLabel = useCategoryLabel()
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
        if (active) setError(tRef.current('constellations.loadFailed'))
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
        if (active) setError(tRef.current('constellations.wishesFailed'))
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
            {t('morning.back')}
          </Link>
          <p className="eyebrow">{t('constellations.eyebrow')}</p>
          <h1>
            {selectedConstellation
              ? categoryLabel(selectedConstellation.slug)
              : t('constellations.title')}
          </h1>
          <p className="page-subtitle">
            {selectedConstellation?.description ?? t('constellations.subtitle')}
          </p>
        </div>
        {selectedConstellation && (
          <div className="page-header-actions">
            <button
              type="button"
              className="primary"
              onClick={() => navigate(`/sky?category=${selectedConstellation.slug}`)}
            >
              {t('constellations.explore')}
            </button>
          </div>
        )}
      </header>

      {error && <div className="error-message"><p>{error}</p></div>}

      {/* Constellation category selector chips */}
      <div className="constellation-chips" role="navigation" aria-label={t('constellations.navLabel')}>
        <Link
          to="/constellations"
          className={`chip ${!slug ? 'active' : ''}`}
        >
          {t('constellations.all')}
        </Link>
        {constellations.map((c) => (
          <Link
            key={c.slug}
            to={`/sky?category=${c.slug}`}
            className={`chip ${slug === c.slug ? 'active' : ''}`}
          >
            {categoryLabel(c.slug)} ({localizeDigits(c.wishCount, language)})
          </Link>
        ))}
      </div>

      {loading ? (
        <p className="page-loading">{t('constellations.loading')}</p>
      ) : !slug ? (
        /* Constellation Overview Grid */
        <div className="constellations-grid">
          {constellations.map((c) => (
            <article
              key={c.slug}
              className="constellation-card"
              onClick={() => navigate(`/sky?category=${c.slug}`)}
            >
              <span className="constellation-mark">✦</span>
              <h2>{categoryLabel(c.slug)}</h2>
              <p className="constellation-desc">{c.description}</p>
              <div className="constellation-footer">
                <span className="constellation-count">
                  {t('constellations.starsConnected', { n: c.wishCount })}
                </span>
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
              <p className="empty-title">{t('constellations.emptyTitle')}</p>
              <p className="empty-desc">
                {t('constellations.emptyDesc', {
                  name: selectedConstellation ? categoryLabel(selectedConstellation.slug) : '',
                })}
              </p>
            </div>
          ) : (
            categoryWishes.map((wish) => (
              <article key={wish.id} className="personal-wish-card">
                <div className="personal-wish-body">
                  <blockquote className="personal-wish-text">“{wish.text}”</blockquote>
                  <div className="personal-wish-meta">
                    <span className="category-pill">{categoryLabel(wish.category)}</span>
                    <span>{t('constellations.sentLight', { n: wish.reactions })}</span>
                  </div>
                </div>
                <div className="personal-wish-actions">
                  <button
                    type="button"
                    className="soft-button"
                    onClick={() => navigate(`/sky?wishId=${wish.id}`)}
                  >
                    {t('constellations.locateStar')}
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
