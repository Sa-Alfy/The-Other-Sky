import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import './App.css'
import { GalaxyCanvas, type GalaxyCanvasRef, type Wish } from './components/GalaxyCanvas'
import { MirrorPanel } from './components/MirrorPanel'
import { Constellations } from './pages/Constellations'
import { MorningSky } from './pages/MorningSky'
import { PersonalSky } from './pages/PersonalSky'

const apiBase = import.meta.env.VITE_API_URL || ''

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
  const galaxyCanvasRef = useRef<GalaxyCanvasRef>(null)

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
          error: payload.error?.message || 'An error occurred',
        }
      }

      return { ok: true, data: payload.data }
    } catch (err) {
      console.error('API call failed:', err)
      return { ok: false, error: 'Network error' }
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
        setError(result.error || 'Failed to load wishes')
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
    } else {
      setError(result.error || 'Failed to send light')
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
      setError('Could not update saved wish')
    }
  }

  const handleCreateWish = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (trimmed.length < 3) {
      setError('Wish must be at least 3 characters')
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
      handleSelectWish(createdWish)
      setDraft('')
      setIsComposerOpen(false)
      setTimeout(() => setIsReleasing(false), 1400)
    } else {
      setError(result.error || 'Failed to create wish')
      setIsReleasing(false)
    }
  }

  const selectedSummary = selectedWish?.text ?? 'No wish selected yet.'

  return (
    <div className="app-shell">
      {!hasEntered && location.pathname === '/' ? (
        <main className="landing-screen" aria-label="The Other Sky landing screen">
          <div className="landing-glow" aria-hidden="true" />
          <div className="landing-copy">
            <p className="eyebrow">There are things we want.</p>
            <h1>THE OTHER SKY</h1>
            <p className="tagline">
              Things we are afraid to say.
              <br />
              Things we still believe might happen.
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
                Enter the Sky
              </button>
              <button type="button" className="secondary" onClick={() => setIsComposerOpen(true)}>
                Leave a Wish
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="galaxy-screen" aria-label="The Other Sky galaxy view">
          <div className="sky-overlay" aria-hidden="true" />

          {isLoading && (
            <div className="loading-indicator" aria-live="polite">
              <p>Loading the sky...</p>
            </div>
          )}

          {error && (
            <div className="error-message" role="alert" aria-live="assertive">
              <p>{error}</p>
              <button type="button" onClick={() => setError(null)} aria-label="Close error message">
                ×
              </button>
            </div>
          )}

          {/* Active Category Filter Indicator */}
          {filterCategory && (
            <div className="active-filter-banner">
              <span>Constellation: <strong>{filterCategory}</strong></span>
              <button
                type="button"
                className="clear-filter-btn"
                onClick={() => setSearchParams({})}
                aria-label="Show all stars"
              >
                Show entire sky ×
              </button>
            </div>
          )}

          <GalaxyCanvas
            ref={galaxyCanvasRef}
            wishes={wishes}
            selectedWish={selectedWish}
            onSelectWish={handleSelectWish}
          />

          <ul className="sr-only" aria-label="Wishes in the sky">
            {wishes.map((wish) => (
              <li key={wish.id}>
                <button type="button" onClick={() => handleSelectWish(wish)}>
                  Open wish: {wish.text}
                </button>
              </li>
            ))}
          </ul>

          <header className="top-bar">
            <div className="brand-group">
              <Link to="/sky" className="brand" onClick={() => setSearchParams({})}>
                THE OTHER SKY
              </Link>
            </div>

            <nav className="top-nav" aria-label="Navigation">
              <Link to="/constellations" className="nav-link">
                Constellations
              </Link>
              <Link to="/morning-sky" className="nav-link">
                Morning Sky
              </Link>
              <Link to="/me" className="nav-link">
                Personal Sky
              </Link>
            </nav>

            <div className="mini-actions">
              <button type="button" className="soft-button" onClick={() => setIsComposerOpen(true)}>
                Leave a Wish
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
                  aria-label="Back to the sky"
                >
                  ×
                </button>
                <div className="wish-mark">✦</div>
                <blockquote>“{selectedSummary}”</blockquote>

                {selectedWish.fulfilledAt && (
                  <div className="fulfillment-badge">
                    <span className="fulfilled-tag">✦ Fulfilled</span>
                    {selectedWish.fulfillmentNote && (
                      <p className="fulfilled-note">“{selectedWish.fulfillmentNote}”</p>
                    )}
                  </div>
                )}

                <div className="wish-meta">
                  <span className="category-pill">{selectedWish.category}</span>
                  <span>•</span>
                  <span>Someone</span>
                  <span>•</span>
                  <span>Recently</span>
                </div>

                <div className="wish-actions">
                  <button type="button" className="primary" onClick={handleLight}>
                    ✦ Send Light
                  </button>
                  <button
                    type="button"
                    className={`secondary ${isSaved ? 'active-save' : ''}`}
                    onClick={handleToggleSave}
                  >
                    {isSaved ? 'Saved ✓' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className={`soft-button mirror-toggle ${showMirror ? 'active' : ''}`}
                    onClick={() => setShowMirror((prev) => !prev)}
                  >
                    ✦ Mirror
                  </button>
                </div>

                <div className="light-count">{selectedWish.reactions} people have sent light.</div>
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
                <p className="empty-wish">Select a star in the sky.</p>
              </>
            )}
          </section>

          {isReleasing && (
            <div className="release-overlay" aria-live="polite">
              <div className="particle" aria-hidden="true" />
              <div className="release-message">
                <p>Your wish is somewhere in this sky now.</p>
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
              aria-label="Close wish composer"
            >
              ×
            </button>
            <p className="eyebrow">What do you wish for?</p>
            <form onSubmit={handleCreateWish}>
              <label className="sr-only" htmlFor="wish-text">
                Write your wish
              </label>
              <textarea
                id="wish-text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={280}
                placeholder="I hope future me is kinder to myself."
              />
              <div className="composer-footer">
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="hope">Hope</option>
                  <option value="love">Love</option>
                  <option value="peace">Peace</option>
                  <option value="healing">Healing</option>
                  <option value="growth">Growth</option>
                  <option value="clarity">Clarity</option>
                </select>
                <button type="submit" className="primary large">
                  Release it
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
