import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/** Calls `onResize` whenever the element's box changes size; a no-op where ResizeObserver is unavailable (jsdom). */
export function useElementResize(target: Ref<HTMLElement | null | undefined>, onResize: () => void): void {
  let observer: ResizeObserver | null = null
  onMounted(() => {
    if (!target.value || typeof ResizeObserver === 'undefined') return
    observer = new ResizeObserver(() => onResize())
    observer.observe(target.value)
  })
  onBeforeUnmount(() => observer?.disconnect())
}
