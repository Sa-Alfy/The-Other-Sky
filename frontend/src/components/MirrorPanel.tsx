import { useEffect, useState } from 'react'
import type { Wish } from './GalaxyCanvas'

interface MirrorPanelProps {
  wish: Wish
  onSelectWish: (wish: Wish) => void
  onClose: () => void
}

interface MirrorResponse {
  relatedWishes: Wish[]
  message: string
}

export function MirrorPanel({ wish, onSelectWish, onClose }: MirrorPanelProps) {
  const [related, setRelated] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("You're not the only one.")

  useEffect(() => {
    let active = true
    const fetchMirror = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/mirror?wishId=${wish.id}`, { credentials: 'include' })
        const json = await res.json()
        if (active && json.success && json.data) {
          const data = json.data as MirrorResponse
          setRelated(data.relatedWishes ?? [])
          if (data.message) setMessage(data.message)
        }
      } catch (err) {
        console.error('Failed to load mirror wishes', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    void fetchMirror()
    return () => {
      active = false
    }
  }, [wish.id])

  return (
    <div className="mirror-panel" role="region" aria-label="Mirror — related wishes">
      <div className="mirror-header">
        <span className="mirror-badge">✦ The Mirror</span>
        <button type="button" className="wish-close" onClick={onClose} aria-label="Close mirror">
          ×
        </button>
      </div>

      <p className="mirror-message">“{message}”</p>

      {loading ? (
        <p className="mirror-loading">Listening for echoes in the sky...</p>
      ) : related.length === 0 ? (
        <p className="mirror-empty">No similar wishes found yet in this part of the sky.</p>
      ) : (
        <ul className="mirror-list">
          {related.map((item) => (
            <li key={item.id} className="mirror-item">
              <button
                type="button"
                className="mirror-button"
                onClick={() => onSelectWish(item)}
              >
                <span className="mirror-text">“{item.text}”</span>
                <span className="mirror-meta">
                  <span className="category-pill">{item.category}</span>
                  <span>{item.reactions} light</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

