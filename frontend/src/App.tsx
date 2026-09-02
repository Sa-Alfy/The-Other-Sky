import { type FormEvent, useEffect, useMemo, useState } from 'react'
import './App.css'

type Wish = {
  id: string
  text: string
  category: string
  status: string
  visibility: string
  createdAt: string
  reactions: number
  x: number
  y: number
  z: number
  size: number
  brightness: number
  hue: number
}

const apiBase = import.meta.env.VITE_API_URL || ''

// Session management
const ANONYMOUS_ID_KEY = 'othersky_anonymous_id'

function getOrCreateAnonymousId(): string {
  const stored = localStorage.getItem(ANONYMOUS_ID_KEY)
  if (stored) return stored
  // Will be set by server response header
  return 'temp'
}

function storeAnonymousId(id: string) {
  localStorage.setItem(ANONYMOUS_ID_KEY, id)
}

function App() {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [entered, setEntered] = useState(false)
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null)
  const [draft, setDraft] = useState('')
  const [category, setCategory] = useState('hope')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [lightPulse, setLightPulse] = useState(0)
  const [anonymousId, setAnonymousId] = useState(getOrCreateAnonymousId())
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Helper to make API calls with anonymous ID
  const apiCall = async (
    endpoint: string,
    options?: RequestInit
  ): Promise<{ ok: boolean; data?: unknown; error?: string }> => {
    try {
      const url = new URL(`${apiBase}${endpoint}`)
      url.searchParams.set('anonymous_id', anonymousId)

      const response = await fetch(url.toString(), {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      // Store anonymous ID from response header if present
      const headerAnonymousId = response.headers.get('X-Anonymous-ID')
      if (headerAnonymousId && headerAnonymousId !== anonymousId) {
        setAnonymousId(headerAnonymousId)
        storeAnonymousId(headerAnonymousId)
      }

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

  useEffect(() => {
    const loadWishes = async () => {
      setIsLoading(true)
      setError(null)
      const result = await apiCall('/api/wishes')
      setIsLoading(false)

      if (result.ok && Array.isArray(result.data)) {
        setWishes(result.data as Wish[])
      } else {
        setError(result.error || 'Failed to load wishes')
      }
    }

    void loadWishes()
  }, [anonymousId])

  const selectedSummary = useMemo(() => {
    if (!selectedWish) return 'No wish selected yet.'
    return selectedWish.text
  }, [selectedWish])

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
      setSelectedWish(createdWish)
      setDraft('')
      setIsComposerOpen(false)
      setTimeout(() => setIsReleasing(false), 1400)
    } else {
      setError(result.error || 'Failed to create wish')
      setIsReleasing(false)
    }
  }

  return (
    <div className="app-shell">
      {!entered ? (
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
              <button type="button" className="primary" onClick={() => setEntered(true)}>
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
          <div className="starfield" aria-label="Galaxy of wishes">
            {wishes.map((wish) => (
              <button
                key={wish.id}
                type="button"
                className={`star ${selectedWish?.id === wish.id ? 'selected' : ''}`}
                style={{
                  left: `${wish.x * 100}%`,
                  top: `${wish.y * 100}%`,
                  width: `${wish.size * 10}px`,
                  height: `${wish.size * 10}px`,
                  opacity: wish.visibility === 'public' ? 1 : 0.6,
                  background: `radial-gradient(circle, hsla(${wish.hue}, 100%, 85%, 1) 0%, hsla(${wish.hue}, 100%, 68%, 0.9) 25%, rgba(255,255,255,0) 100%)`,
                  boxShadow: `0 0 ${wish.brightness * 18 + 10}px hsla(${wish.hue}, 100%, 75%, 0.9)`,
                }}
                aria-label={`Open wish: ${wish.text}`}
                onClick={() => setSelectedWish(wish)}
              />
            ))}
          </div>

          <header className="top-bar">
            <div>
              <span className="brand">THE OTHER SKY</span>
            </div>
            <div className="mini-actions">
              <button type="button" className="soft-button" onClick={() => setIsComposerOpen(true)}>
                Leave a Wish
              </button>
            </div>
          </header>

          <section className="wish-card" aria-live="polite">
            {selectedWish ? (
              <>
                <div className="wish-mark">✦</div>
                <blockquote>“{selectedSummary}”</blockquote>
                <div className="wish-meta">
                  <span>Someone</span>
                  <span>•</span>
                  <span>Recently</span>
                </div>
                <div className="wish-actions">
                  <button type="button" className="primary" onClick={handleLight}>
                    ✦ Send Light
                  </button>
                  <button type="button" className="secondary" onClick={() => setSelectedWish(selectedWish)}>
                    Save
                  </button>
                </div>
                <div className="light-count">{selectedWish.reactions} people have sent light.</div>
                {lightPulse > 0 && <div className="light-pulse" aria-hidden="true" />}
              </>
            ) : (
              <>
                <div className="wish-mark">✦</div>
                <p className="empty-wish">Select a star in the sky.</p>
              </>
            )}
          </section>

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
    </div>
  )
}

export default App
