import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export interface ToastItem {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

export interface ToastInput {
  title: string
  description?: string
  tone?: ToastTone
}

const AUTO_DISMISS_MS = 4000

export const useToastsStore = defineStore('toasts', () => {
  const items = ref<ToastItem[]>([])
  let nextId = 1

  function dismiss(id: number): void {
    items.value = items.value.filter((toast) => toast.id !== id)
  }

  /** Enqueue a transient toast; it auto-dismisses after a fixed delay. Returns its id. */
  function push(input: ToastInput): number {
    const id = nextId++
    items.value.push({ id, tone: 'info', ...input })
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    return id
  }

  return { items, push, dismiss }
})
