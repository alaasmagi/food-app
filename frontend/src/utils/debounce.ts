/**
 * Trailing-edge debounce: delays invoking `fn` until `wait` ms have elapsed since the last call.
 * Used to coalesce rapid map move/zoom events into a single viewport fetch. Call `.cancel()` to
 * drop a pending invocation (e.g. on component unmount).
 */
export interface Debounced<A extends unknown[]> {
  (...args: A): void
  cancel(): void
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | null = null

  const debounced = (...args: A): void => {
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, wait)
  }

  debounced.cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  return debounced
}
