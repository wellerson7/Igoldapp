// /hooks/useI18n.ts
import { useState, useEffect, useMemo } from 'react'
import { messages } from '../i18n'

export function useI18n() {
  const [lang, setLang] = useState<'en'|'pt'>('en')
  useEffect(() => {
    const nav = navigator.language.slice(0,2)
    setLang(nav === 'pt' ? 'pt' : 'en')
  }, [])
  const t = useMemo(
    () => (key: keyof typeof messages.en) => messages[lang][key] ?? messages.en[key],
    [lang]
  )
  return { t }
}
