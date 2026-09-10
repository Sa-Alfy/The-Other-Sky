import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  LanguageContext,
  localizeDigits,
  readStoredLanguage,
  strings,
  type Language,
  type Translate,
} from './i18n'

const STORAGE_KEY = 'othersky_lang'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // Preference just won't persist; the app still works this session.
    }
  }, [language])

  const setLanguage = useCallback((next: Language) => setLanguageState(next), [])

  const t = useCallback<Translate>(
    (key, vars) => {
      let text: string = strings[key][language]
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          const rendered =
            typeof value === 'number' ? localizeDigits(value, language) : value
          text = text.replace(`{${name}}`, rendered)
        }
      }
      return text
    },
    [language]
  )

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
