import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Wish } from '../components/GalaxyCanvas'
import { localizeDigits, useCategoryLabel, useLanguage } from '../i18n'

interface PersonalSkyData {
  ownWishes: Wish[]
  savedWishes: Wish[]
  lightedWishes: Wish[]
  hasRecoveryPhrase: boolean
}

// ──────────────────────────────────────────
// Recovery Phrase Modal (shown after generating)
// ──────────────────────────────────────────
interface PhraseModalProps {
  phrase: string
  onDone: () => void
}

function PhraseModal({ phrase, onDone }: PhraseModalProps) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phrase)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
    }
  }

  return (
    <div className="recovery-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="phrase-modal-title">
      <div className="recovery-modal">
        <h2 id="phrase-modal-title" className="recovery-modal-title">{t('recovery.phraseTitle')}</h2>
        <p className="recovery-modal-subtitle">
          {t('recovery.phraseSubtitle')}
        </p>

        <div className="recovery-phrase-box">
          <p className="recovery-phrase-text" aria-label={t('recovery.phraseLabel')}>{phrase}</p>
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            onClick={handleCopy}
            aria-label={t('recovery.copyLabel')}
          >
            {copied ? t('release.copied') : t('release.copy')}
          </button>
        </div>

        <div className="recovery-warning-box" role="alert">
          <strong>{t('recovery.warningStrong')}</strong> {t('recovery.warningRest')}
        </div>

        <label className="recovery-confirm-row">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I have saved my recovery phrase
        </label>

        <div className="recovery-modal-actions">
          <button
            type="button"
            className="primary"
            disabled={!confirmed}
            onClick={onDone}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Recover Sky Modal (entry form)
// ──────────────────────────────────────────
interface RecoverModalProps {
  onClose: () => void
}

function RecoverModal({ onClose }: RecoverModalProps) {
  const { t } = useLanguage()
  const [phrase, setPhrase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch('/api/me/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phrase: phrase.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        window.location.reload()
      } else {
        setError(json.error?.message ?? t('recovery.invalid'))
      }
    } catch {
      setError(t('error.retry'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="recovery-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="recover-modal-title">
      <div className="recovery-modal">
        <h2 id="recover-modal-title" className="recovery-modal-title">{t('recovery.recoverTitle')}</h2>
        <p className="recovery-modal-subtitle">
          {t('recovery.recoverSubtitle')}
        </p>

        <form className="recover-sky-form" onSubmit={handleRecover}>
          <label className="sr-only" htmlFor="recovery-phrase-input">
            {t('recovery.phraseLabel')}
          </label>
          <input
            id="recovery-phrase-input"
            ref={inputRef}
            type="text"
            className="recover-input"
            placeholder="word-word-word-word"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />

          {error && (
            <div className="error-message" role="alert">
              <p>{error}</p>
            </div>
          )}

          <div className="recovery-modal-actions">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary"
              disabled={isLoading || phrase.trim().length === 0}
            >
              {isLoading ? t('recovery.recovering') : t('recovery.recoverButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Main PersonalSky page
// ──────────────────────────────────────────
export function PersonalSky() {
  const { t, language } = useLanguage()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const categoryLabel = useCategoryLabel()
  const [activeTab, setActiveTab] = useState<'own' | 'saved' | 'lighted'>('own')
  const [skyData, setSkyData] = useState<PersonalSkyData>({
    ownWishes: [],
    savedWishes: [],
    lightedWishes: [],
    hasRecoveryPhrase: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fulfillingWishId, setFulfillingWishId] = useState<string | null>(null)
  const [fulfillNote, setFulfillNote] = useState('')
  const navigate = useNavigate()

  // Recovery phrase state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPhrase, setGeneratedPhrase] = useState<string | null>(null)
  const [showRecoverModal, setShowRecoverModal] = useState(false)

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
          setError(json.error?.message || tRef.current('error.loadPersonal'))
        }
      } catch {
        if (active) setError(tRef.current('error.networkPersonal'))
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
        setError(json.error?.message || t('error.fulfill'))
      }
    } catch {
      setError(t('error.fulfillFailed'))
    }
  }

  const handleProtect = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/me/recovery-phrase', {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json()
      if (json.success && json.data?.phrase) {
        setGeneratedPhrase(json.data.phrase)
      } else if (res.status === 409) {
        setError('A recovery phrase is already set for this sky.')
        setSkyData((prev) => ({ ...prev, hasRecoveryPhrase: true }))
      } else {
        setError(json.error?.message || t('recovery.generateFailed'))
      }
    } catch {
      setError(t('error.retry'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePhraseModalDone = () => {
    setGeneratedPhrase(null)
    setSkyData((prev) => ({ ...prev, hasRecoveryPhrase: true }))
  }

  const currentList =
    activeTab === 'own'
      ? skyData.ownWishes
      : activeTab === 'saved'
        ? skyData.savedWishes
        : skyData.lightedWishes

  return (
    <div className="page-container personal-sky-page">
      {/* Phrase display modal */}
      {generatedPhrase && (
        <PhraseModal phrase={generatedPhrase} onDone={handlePhraseModalDone} />
      )}

      {/* Recover sky modal */}
      {showRecoverModal && (
        <RecoverModal onClose={() => setShowRecoverModal(false)} />
      )}

      <header className="page-header">
        <div className="page-header-left">
          <Link to="/sky" className="back-link">
            {t('morning.back')}
          </Link>
          <h1>{t('personal.title')}</h1>
          <p className="page-subtitle">{t('personal.subtitle')}</p>

          <div className="page-header-actions">
            {skyData.hasRecoveryPhrase ? (
              <span className="sky-protected-badge">{t('personal.protected')}</span>
            ) : (
              <button
                type="button"
                className="soft-button"
                onClick={handleProtect}
                disabled={isGenerating || loading}
              >
                {isGenerating ? t('personal.generating') : t('personal.protect')}
              </button>
            )}
          </div>
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
          {t('personal.tabOwn')} ({localizeDigits(skyData.ownWishes.length, language)})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'saved'}
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          {t('personal.tabSaved')} ({localizeDigits(skyData.savedWishes.length, language)})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'lighted'}
          className={`tab-btn ${activeTab === 'lighted' ? 'active' : ''}`}
          onClick={() => setActiveTab('lighted')}
        >
          {t('personal.tabLight')} ({localizeDigits(skyData.lightedWishes.length, language)})
        </button>
      </div>

      {error && <div className="error-message"><p>{error}</p></div>}

      {loading ? (
        <p className="page-loading">{t('personal.loading')}</p>
      ) : currentList.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">{t('personal.emptyTitle')}</p>
          <p className="empty-desc">
            {activeTab === 'own' && "You haven't left a wish in the sky yet."}
            {activeTab === 'saved' && "You haven't saved any stranger's wish yet."}
            {activeTab === 'lighted' && "You haven't sent light to any wish yet."}
          </p>
          <Link to="/sky" className="primary action-btn">
            Explore the Sky
          </Link>

          <div className="recovery-entry">
            <button
              type="button"
              className="recovery-link-btn"
              onClick={() => setShowRecoverModal(true)}
            >
              {t('personal.recoverEntry')}
            </button>
          </div>
        </div>
      ) : (
        <div className="wish-list">
          {currentList.map((wish) => (
            <article key={wish.id} className="personal-wish-card">
              <div className="personal-wish-body">
                <blockquote className="personal-wish-text">"{wish.text}"</blockquote>
                {wish.fulfilledAt && (
                  <div className="fulfillment-badge">
                    <span className="fulfilled-tag">{t('wish.fulfilled')}</span>
                    {wish.fulfillmentNote && (
                      <p className="fulfilled-note">"{wish.fulfillmentNote}"</p>
                    )}
                  </div>
                )}
                <div className="personal-wish-meta">
                  <span className="category-pill">{categoryLabel(wish.category)}</span>
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
                  {t('constellations.locateStar')}
                </button>

                {activeTab === 'saved' && (
                  <button
                    type="button"
                    className="soft-button danger-hover"
                    onClick={() => handleUnsave(wish.id)}
                  >
                    {t('personal.unsave')}
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
                    {t('personal.markFulfilled')}
                  </button>
                )}
              </div>

              {fulfillingWishId === wish.id && (
                <div className="fulfillment-inline-form">
                  <p className="form-label">{t('personal.noteLabel')}</p>
                  <input
                    type="text"
                    maxLength={280}
                    placeholder={t('personal.notePlaceholder')}
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
                      {t('personal.confirmFulfillment')}
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

          <div className="recovery-entry">
            <button
              type="button"
              className="recovery-link-btn"
              onClick={() => setShowRecoverModal(true)}
            >
              {t('personal.recoverEntry')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
