import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Wish } from '../components/GalaxyCanvas'
import { useCategoryLabel, useLanguage } from '../i18n'

export function MorningSky() {
  const { t, language } = useLanguage()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const categoryLabel = useCategoryLabel()
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
          setError(json.error?.message || tRef.current('morning.loadFailed'))
        }
      } catch {
        setError(tRef.current('morning.networkError'))
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
            {t('morning.back')}
          </Link>
          <div className="morning-glow" aria-hidden="true" />
          <p className="eyebrow golden">{t('morning.eyebrow')}</p>
          <h1>{t('morning.title')}</h1>
          <p className="page-subtitle">
            {t('morning.subtitle')}
          </p>
        </div>
      </header>

      {error && <div className="error-message"><p>{error}</p></div>}

      {loading ? (
        <p className="page-loading">{t('morning.loading')}</p>
      ) : fulfilledWishes.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">{t('morning.emptyTitle')}</p>
          <p className="empty-desc">
            {t('morning.emptyDesc')}
          </p>
          <Link to="/sky" className="primary action-btn">
            {t('morning.lookAtNight')}
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
                    <span className="morning-note-label">{t('morning.noteLabel')}</span>
                    <p className="morning-note-text">“{wish.fulfillmentNote}”</p>
                  </div>
                )}
                <div className="personal-wish-meta">
                  <span className="category-pill golden-pill">{categoryLabel(wish.category)}</span>
                  <span>{t('morning.witnessed', { n: wish.reactions })}</span>
                  {wish.fulfilledAt && (
                    <span>
                      {t('morning.fulfilledOn', {
                        date: new Date(wish.fulfilledAt).toLocaleDateString(
                          language === 'bn' ? 'bn-BD' : 'en-US'
                        ),
                      })}
                    </span>
                  )}
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
          ))}
        </div>
      )}
    </div>
  )
}
