import { useEffect, useState } from 'react'
import type { Wish } from './GalaxyCanvas'
import { useCategoryLabel, useLanguage } from '../i18n'

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
  const { t } = useLanguage()
  const categoryLabel = useCategoryLabel()
  const [related, setRelated] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)

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
    <div className="mirror-panel" role="region" aria-label={t('mirror.regionLabel')}>
      <div className="mirror-header">
        <span className="mirror-badge">{t('mirror.badge')}</span>
        <button type="button" className="wish-close" onClick={onClose} aria-label={t('mirror.close')}>
          ×
        </button>
      </div>

      <p className="mirror-message">“{t('mirror.message')}”</p>

      {loading ? (
        <p className="mirror-loading">{t('mirror.loading')}</p>
      ) : related.length === 0 ? (
        <p className="mirror-empty">{t('mirror.empty')}</p>
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
                  <span className="category-pill">{categoryLabel(item.category)}</span>
                  <span>{t('mirror.light', { n: item.reactions })}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

