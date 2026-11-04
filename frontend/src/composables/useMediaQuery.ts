import { onBeforeUnmount, ref, type Ref } from 'vue'

/** Reactive match state of a CSS media query; false where matchMedia is unavailable (jsdom). */
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(false)
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return matches

  const list = window.matchMedia(query)
  matches.value = list.matches
  const onChange = (event: MediaQueryListEvent) => (matches.value = event.matches)
  list.addEventListener('change', onChange)
  onBeforeUnmount(() => list.removeEventListener('change', onChange))
  return matches
}
