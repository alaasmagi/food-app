import { ref } from 'vue'

// The app ships a dark and a light theme, opted into via `<html data-theme="...">`.
// This composable owns the shared, persisted theme choice and keeps the document
// attribute in sync. The initial attribute is set by a pre-paint script in index.html;
// here we read it back so state and DOM agree from the first render.

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function systemTheme(): Theme {
  // matchMedia is absent in the jsdom test environment - fall back to dark.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function readStored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function initialTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'light' || attr === 'dark') return attr
  return readStored() ?? systemTheme()
}

function apply(value: Theme): void {
  document.documentElement.setAttribute('data-theme', value)
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* storage unavailable - the attribute alone still drives the theme */
  }
}

const theme = ref<Theme>(initialTheme())
// Reflect state onto the document once at module load so the two never diverge.
apply(theme.value)

export function useTheme() {
  function setTheme(value: Theme): void {
    theme.value = value
    apply(value)
  }

  function toggleTheme(): void {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggleTheme }
}
