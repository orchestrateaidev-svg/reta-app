import { useEffect } from 'react'
import type { ThemePref } from '../db/settings'

/** Apply the theme preference to <html data-theme> and persist a copy in
 *  localStorage so index.html can restore it before first paint (no flash). */
export function applyTheme(pref: ThemePref): void {
  const root = document.documentElement
  if (pref === 'system') {
    root.removeAttribute('data-theme')
    try {
      localStorage.removeItem('reta.theme')
    } catch {
      /* ignore */
    }
  } else {
    root.setAttribute('data-theme', pref)
    try {
      localStorage.setItem('reta.theme', pref)
    } catch {
      /* ignore */
    }
  }
}

export function useApplyTheme(pref: ThemePref | undefined): void {
  useEffect(() => {
    if (pref) applyTheme(pref)
  }, [pref])
}
