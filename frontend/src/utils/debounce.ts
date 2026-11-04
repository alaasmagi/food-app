/** Trailing-edge debounce; `.cancel()` drops a pending invocation. */
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
