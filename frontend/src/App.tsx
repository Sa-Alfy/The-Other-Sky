import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import './App.css'
import { GalaxyCanvas, type GalaxyCanvasRef, type Wish } from './components/GalaxyCanvas'
import { MirrorPanel } from './components/MirrorPanel'
import { Constellations } from './pages/Constellations'
import { MorningSky } from './pages/MorningSky'
import { PersonalSky } from './pages/PersonalSky'
import { formatRelativeTime } from './utils/formatRelativeTime'
import { localizeDigits, useCategoryLabel, useLanguage } from './i18n'

const apiBase = import.meta.env.VITE_API_URL || ''

// Duration of the wish-becomes-a-star flight, kept in sync with the
// wishFlight/wishCollapse keyframes in App.css.
const RELEASE_FLIGHT_MS = 1700

function GalaxyView() {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null)
  const [draft, setDraft] = useState('')
  const [category, setCategory] = useState('hope')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [lightPulse, setLightPulse] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showMirror, setShowMirror] = useState(false)
  const [releaseLink, setReleaseLink] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [releaseText, setReleaseText] = useState('')
  const [releasePhase, setReleasePhase] = useState<'flying' | 'landed' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const galaxyCanvasRef = useRef<GalaxyCanvasRef>(null)

  const { t, language, setLanguage } = useLanguage()
  // Effects must not depend on t (it changes with language); a ref keeps the
  // latest translator available without making language a refetch trigger.
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const categoryLabel = useCategoryLabel()

  const [searchParams, setSearchParams] = useSearchParams()
  const filterCategory = searchParams.get('category')
  const targetWishId = searchParams.get('wishId')
  const navigate = useNavigate()
  const location = useLocation()

  // Track if user entered the sky from the landing overlay
  const [hasEntered, setHasEntered] = useState(location.pathname === '/sky')

  const apiCall = async (
    endpoint: string,
    options?: RequestInit
  ): Promise<{ ok: boolean; data?: unknown; error?: string }> => {
    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      const payload = await response.json()

      if (!response.ok) {
        return {
          ok: false,
          error: payload.error?.message || tRef.current('error.generic'),
        }
      }

      return { ok: true, data: payload.data }
    } catch (err) {
      console.error('API call failed:', err)
      return { ok: false, error: tRef.current('error.network') }
    }
  }

  // Load wishes
  useEffect(() => {
    const loadWishes = async () => {
      setIsLoading(true)
      setError(null)
      const endpoint = filterCategory
        ? `/api/wishes?category=${encodeURIComponent(filterCategory)}`
        : '/api/wishes'
      const result = await apiCall(endpoint)
      setIsLoading(false)

      if (result.ok && Array.isArray(result.data)) {
        setWishes(result.data as Wish[])
      } else {
        setError(result.error || tRef.current('error.loadWishes'))
      }
    }

    void loadWishes()
  }, [filterCategory])

  const lastTargetWishIdRef = useRef<string | null>(null)

  // Deep-link selection from ?wishId=
  useEffect(() => {
    if (!targetWishId) {
      lastTargetWishIdRef.current = null
      return
    }
    if (wishes.length === 0) return
    if (lastTargetWishIdRef.current === targetWishId) return

    const matched = wishes.find((w) => w.id === targetWishId)
    if (matched) {
      lastTargetWishIdRef.current = targetWishId
      setTimeout(() => {
        setSelectedWish(matched)
        galaxyCanvasRef.current?.recenterOnWish(matched)
        setHasEntered(true)
      }, 0)
    }
  }, [targetWishId, wishes])

  const handleCloseWish = useCallback(() => {
    setSelectedWish(null)
    setShowMirror(false)
    if (searchParams.has('wishId')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('wishId')
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Escape key closes modal / card
  useEffect(() => {
    if (!selectedWish) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseWish()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedWish, handleCloseWish])

  const handleSelectWish = (wish: Wish | null) => {
    setSelectedWish(wish)
    setIsSaved(false)
    setShowMirror(false)
    if (wish) {
      galaxyCanvasRef.current?.recenterOnWish(wish)
    } else {
      handleCloseWish()
    }
  }

  const handleLight = async () => {
    if (!selectedWish) return
    setError(null)
    const result = await apiCall(`/api/wishes/${selectedWish.id}/light`, {
      method: 'POST',
      body: JSON.stringify({ wishId: selectedWish.id }),
    })

    if (result.ok && result.data) {
      const updatedWish = result.data as Wish
      setWishes((current) =>
        current.map((wish) => (wish.id === updatedWish.id ? updatedWish : wish)),
      )
      setSelectedWish(updatedWish)
      setLightPulse((value) => value + 1)
      galaxyCanvasRef.current?.flareWish(updatedWish.id)
    } else {
      setError(result.error || t('error.sendLight'))
    }
  }

  const handleToggleSave = async () => {
    if (!selectedWish) return
    try {
      if (isSaved) {
        const res = await apiCall(`/api/wishes/${selectedWish.id}/save`, {
          method: 'DELETE',
        })
        if (res.ok) setIsSaved(false)
      } else {
        const res = await apiCall(`/api/wishes/${selectedWish.id}/save`, {
          method: 'POST',
        })
        if (res.ok) setIsSaved(true)
      }
    } catch {
      setError(t('error.saveWish'))
    }
  }

  const handleCreateWish = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (trimmed.length < 3) {
      setError(t('error.tooShort'))
      return
    }

    setError(null)
    setIsReleasing(true)

    const result = await apiCall('/api/wishes', {
      method: 'POST',
      body: JSON.stringify({ text: trimmed, category, visibility: 'public' }),
    })

    if (result.ok && result.data) {
      const createdWish = result.data as Wish
      setWishes((current) => [createdWish, ...current])
      setDraft('')
      setIsComposerOpen(false)
      setLinkCopied(false)

      // Show the wish itself collapsing into a star and travelling to the
      // point in the sky where its star actually lands.
      setReleaseText(trimmed)
      setReleasePhase('flying')
      setReleaseLink(null)

      // The camera glides to the new star while the light rises, so the sky is
      // already settled on it by the time the flare lands.
      galaxyCanvasRef.current?.recenterOnWish(createdWish)

      window.setTimeout(() => {
        galaxyCanvasRef.current?.flareWish(createdWish.id)
        handleSelectWish(createdWish)
        setReleasePhase('landed')
        setReleaseLink(`${window.location.origin}/sky?wishId=${createdWish.id}`)
      }, RELEASE_FLIGHT_MS)
    } else {
      setError(result.error || t('error.createWish'))
      setIsReleasing(false)
    }
  }

  const handleCloseRelease = useCallback(() => {
    setIsReleasing(false)
    setReleaseLink(null)
    setLinkCopied(false)
    setReleasePhase(null)
    setReleaseText('')
  }, [])

  const handleCopyReleaseLink = async () => {
    if (!releaseLink) return
    try {
      await navigator.clipboard.writeText(releaseLink)
      setLinkCopied(true)
    } catch {
      setLinkCopied(false)
    }
  }

  const selectedSummary = selectedWish?.text ?? t('wish.none')

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const visibleWishes = useMemo(() => {
    if (!trimmedQuery) return wishes
    return wishes.filter((wish) => wish.text.toLowerCase().includes(trimmedQuery))
  }, [wishes, trimmedQuery])

  return (
    <div className="app-shell">
      {!hasEntered && location.pathname === '/' ? (
        <main className="landing-screen" aria-label={t('landing.title')}>
          <div className="landing-glow" aria-hidden="true" />
          <button
            type="button"
            className="soft-button lang-toggle lang-toggle--landing"
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            aria-label={t('nav.languageLabel')}
          >
            {t('nav.language')}
          </button>
          <div className="landing-copy">
            <p className="eyebrow">{t('landing.eyebrow')}</p>
            <h1>{t('landing.title')}</h1>
            <p className="tagline">
              {t('landing.tagline1')}
              <br />
              {t('landing.tagline2')}
            </p>
            <div className="landing-actions">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setHasEntered(true)
                  navigate('/sky')
                }}
              >
                {t('landing.enter')}
              </button>
              <button type="button" className="secondary" onClick={() => setIsComposerOpen(true)}>
                {t('nav.leaveWish')}
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="galaxy-screen" aria-label={t('nav.brand')}>
          <div className="sky-overlay" aria-hidden="true" />

          {isLoading && (
            <div className="loading-indicator" aria-live="polite">
              <p>{t('sky.loading')}</p>
            </div>
          )}

          {error && (
            <div className="error-message" role="alert" aria-live="assertive">
              <p>{error}</p>
              <button type="button" onClick={() => setError(null)} aria-label={t('error.close')}>
                ×
              </button>
            </div>
          )}

          {/* Active Category Filter Indicator */}
          {filterCategory && (
            <div className="active-filter-banner">
              <span>
                {t('sky.constellationBanner')}: <strong>{categoryLabel(filterCategory)}</strong>
              </span>
              <button
                type="button"
                className="clear-filter-btn"
                onClick={() => setSearchParams({})}
                aria-label={t('sky.showAllStars')}
              >
                {t('sky.showEntireSky')}
              </button>
            </div>
          )}

          <GalaxyCanvas
            ref={galaxyCanvasRef}
            wishes={visibleWishes}
            selectedWish={selectedWish}
            onSelectWish={handleSelectWish}
            showConstellationLines={Boolean(filterCategory)}
          />

          <div className="sky-controls">
            <button
              type="button"
              className="sky-control"
              onClick={() => galaxyCanvasRef.current?.zoomBy(1.3)}
              aria-label={t('sky.zoomIn')}
              title={t('sky.zoomIn')}
            >
              +
            </button>
            <button
              type="button"
              className="sky-control"
              onClick={() => galaxyCanvasRef.current?.zoomBy(1 / 1.3)}
              aria-label={t('sky.zoomOut')}
              title={t('sky.zoomOut')}
            >
              −
            </button>
            <button
              type="button"
              className="sky-control sky-control--wide"
              onClick={() => {
                handleCloseWish()
                galaxyCanvasRef.current?.resetView()
              }}
              aria-label={t('sky.recenterLabel')}
              title={t('sky.recenterLabel')}
            >
              {t('sky.recenter')}
            </button>
          </div>

          <ul className="sr-only" aria-label={t('sky.wishesLabel')}>
            {visibleWishes.map((wish) => (
              <li key={wish.id}>
                <button type="button" onClick={() => handleSelectWish(wish)}>
                  {t('sky.openWish')}: {wish.text}
                </button>
              </li>
            ))}
          </ul>

          <header className="top-bar">
            <div className="brand-group">
              <Link to="/sky" className="brand" onClick={() => setSearchParams({})}>
                {t('nav.brand')}
              </Link>
            </div>

            <nav className="top-nav" aria-label="Navigation">
              <Link to="/constellations" className="nav-link">
                {t('nav.constellations')}
              </Link>
              <Link to="/morning-sky" className="nav-link">
                {t('nav.morningSky')}
              </Link>
              <Link to="/me" className="nav-link">
                {t('nav.personalSky')}
              </Link>
            </nav>

            <div className="mini-actions">
              <div className="sky-search">
                <label className="sr-only" htmlFor="sky-search-input">
                  {t('sky.searchLabel')}
                </label>
                <input
                  id="sky-search-input"
                  type="search"
                  className="sky-search-input"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t('sky.search')}
                />
                {trimmedQuery && (
                  <span className="sky-search-count" aria-live="polite">
                    {visibleWishes.length}
                  </span>
                )}
              </div>
              <button type="button" className="soft-button" onClick={() => setIsComposerOpen(true)}>
                {t('nav.leaveWish')}
              </button>
              <button
                type="button"
                className="soft-button lang-toggle"
                onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                aria-label={t('nav.languageLabel')}
              >
                {t('nav.language')}
              </button>
            </div>
          </header>

          <section
            className={`wish-card ${selectedWish ? 'wish-card--selected' : 'wish-card--empty'}`}
            aria-live="polite"
          >
            {selectedWish ? (
              <>
                <button
                  type="button"
                  className="wish-close"
                  onClick={handleCloseWish}
                  aria-label={t('wish.close')}
                >
                  ×
                </button>
                <div className="wish-mark">✦</div>
                <blockquote>“{selectedSummary}”</blockquote>

                {selectedWish.fulfilledAt && (
                  <div className="fulfillment-badge">
                    <span className="fulfilled-tag">{t('wish.fulfilled')}</span>
                    {selectedWish.fulfillmentNote && (
                      <p className="fulfilled-note">“{selectedWish.fulfillmentNote}”</p>
                    )}
                  </div>
                )}

                <div className="wish-meta">
                  <span className="category-pill">{categoryLabel(selectedWish.category)}</span>
                  <span>•</span>
                  <span>{t('wish.someone')}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(selectedWish.createdAt, t)}</span>
                </div>

                <div className="wish-actions">
                  <button type="button" className="primary" onClick={handleLight}>
                    {t('wish.sendLight')}
                  </button>
                  <button
                    type="button"
                    className={`secondary ${isSaved ? 'active-save' : ''}`}
                    onClick={handleToggleSave}
                  >
                    {isSaved ? t('wish.saved') : t('wish.save')}
                  </button>
                  <button
                    type="button"
                    className={`soft-button mirror-toggle ${showMirror ? 'active' : ''}`}
                    onClick={() => setShowMirror((prev) => !prev)}
                  >
                    {t('wish.mirror')}
                  </button>
                </div>

                <div className="light-count">
                  {t('wish.lightCount', { n: selectedWish.reactions })}
                </div>
                {lightPulse > 0 && <div className="light-pulse" aria-hidden="true" />}

                {showMirror && (
                  <MirrorPanel
                    wish={selectedWish}
                    onSelectWish={handleSelectWish}
                    onClose={() => setShowMirror(false)}
                  />
                )}
              </>
            ) : (
              <>
                <div className="wish-mark">✦</div>
                <p className="empty-wish">{t('wish.empty')}</p>
              </>
            )}
          </section>

          {isReleasing && (
            <div className="release-overlay" aria-live="polite">
              {releasePhase === 'flying' && (
                <>
                  <p className="release-wish-text" aria-hidden="true">
                    “{releaseText}”
                  </p>
                  <div className="release-star" aria-hidden="true" />
                </>
              )}

              <div className={`release-message ${releasePhase === 'landed' ? 'is-visible' : ''}`}>
                <p>{t('release.done')}</p>
                {releaseLink && (
                  <div className="release-link-box">
                    <p className="release-link-hint">{t('release.keepLink')}</p>
                    <div className="release-link-row">
                      <label className="sr-only" htmlFor="release-link-input">
                        {t('release.linkLabel')}
                      </label>
                      <input
                        id="release-link-input"
                        type="text"
                        readOnly
                        value={releaseLink}
                        onFocus={(event) => event.target.select()}
                      />
                      <button type="button" className="soft-button" onClick={handleCopyReleaseLink}>
                        {linkCopied ? t('release.copied') : t('release.copy')}
                      </button>
                    </div>
                  </div>
                )}
                <button type="button" className="secondary" onClick={handleCloseRelease}>
                  {t('release.continue')}
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {isComposerOpen && (
        <div className="composer-backdrop" role="dialog" aria-modal="true">
          <div className="composer-panel">
            <button
              type="button"
              className="close-button"
              onClick={() => setIsComposerOpen(false)}
              aria-label={t('composer.close')}
            >
              ×
            </button>
            <p className="eyebrow">{t('composer.prompt')}</p>
            <form onSubmit={handleCreateWish}>
              <label className="sr-only" htmlFor="wish-text">
                {t('composer.label')}
              </label>
              <textarea
                id="wish-text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={280}
                placeholder={t('composer.placeholder')}
              />
              <div
                className={`composer-counter ${draft.length > 260 ? 'composer-counter--near-limit' : ''}`}
                aria-live="polite"
              >
                {localizeDigits(draft.length, language)} / {localizeDigits(280, language)}
              </div>
              <div className="composer-footer">
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  {['hope', 'love', 'peace', 'healing', 'growth', 'clarity'].map((slug) => (
                    <option key={slug} value={slug}>
                      {categoryLabel(slug)}
                    </option>
                  ))}
                </select>
                <button type="submit" className="primary large">
                  {t('composer.release')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<GalaxyView />} />
      <Route path="/sky" element={<GalaxyView />} />
      <Route path="/me" element={<PersonalSky />} />
      <Route path="/morning-sky" element={<MorningSky />} />
      <Route path="/constellations" element={<Constellations />} />
      <Route path="/constellations/:slug" element={<Constellations />} />
    </Routes>
  )
}

export default App
