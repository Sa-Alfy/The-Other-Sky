import { type FormEvent, useEffect, useRef, useState } from 'react'
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

function App() {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [entered, setEntered] = useState(false)
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null)
  const [draft, setDraft] = useState('')
  const [category, setCategory] = useState('hope')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [lightPulse, setLightPulse] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !entered) return
    const context = canvas.getContext('2d')
    if (!context) return

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(rect.width * ratio))
      canvas.height = Math.max(1, Math.floor(rect.height * ratio))
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, rect.width, rect.height)
      wishes.forEach((wish) => {
        const x = wish.x * rect.width
        const y = wish.y * rect.height
        const radius = Math.max(4, wish.size * 5)
        const glow = context.createRadialGradient(x, y, 0, x, y, radius * 4)
        glow.addColorStop(0, `hsla(${wish.hue}, 100%, 90%, ${Math.min(1, wish.brightness)})`)
        glow.addColorStop(0.25, `hsla(${wish.hue}, 100%, 70%, 0.75)`)
        glow.addColorStop(1, 'rgba(255,255,255,0)')
        context.fillStyle = glow
        context.beginPath()
        context.arc(x, y, radius * 4, 0, Math.PI * 2)
        context.fill()
        if (selectedWish?.id === wish.id) {
          context.strokeStyle = 'rgba(255,255,255,0.9)'
          context.lineWidth = 1
          context.beginPath()
          context.arc(x, y, radius + 4, 0, Math.PI * 2)
          context.stroke()
        }
      })
    }

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [entered, selectedWish, wishes])

  const selectNearestWish = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const clickY = event.clientY - rect.top
    const nearest = wishes.reduce<{ wish: Wish | null; distance: number }>((current, wish) => {
      const distance = Math.hypot(wish.x * rect.width - clickX, wish.y * rect.height - clickY)
      return distance < current.distance ? { wish, distance } : current
    }, { wish: null, distance: Number.POSITIVE_INFINITY })
    if (nearest.wish && nearest.distance <= Math.max(18, nearest.wish.size * 8)) setSelectedWish(nearest.wish)
  }

  const selectedSummary = selectedWish?.text ?? 'No wish selected yet.'

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
          <canvas ref={canvasRef} className="starfield" aria-label="Galaxy of wishes" onClick={selectNearestWish} />
          <ul className="sr-only" aria-label="Wishes in the sky">
            {wishes.map((wish) => (
              <li key={wish.id}><button type="button" onClick={() => setSelectedWish(wish)}>Open wish: {wish.text}</button></li>
            ))}
          </ul>

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
