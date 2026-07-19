import { computed, ref, watch } from 'vue'
import { getRestaurantsPage } from '../api/restaurants'
import { debounce } from '../utils/debounce'
import type { Restaurant } from '../types/restaurant'

const DEFAULT_PAGE_SIZE = 20

/**
 * Server-side paged, name/city-searchable restaurant list for the "pick a restaurant" dialogs (the
 * wheel editor, the environment add-picker). Each caller gets its own isolated state, so a dialog
 * never fetches or holds the whole catalog and never clashes with the dashboard's own paged list.
 *
 * Search is debounced and resets to page 1; overlapping fetches (typing, paging) are guarded by a
 * request token so only the latest result is kept. Call `reset()` then `load()` when a dialog opens.
 */
export function useRestaurantSearch(pageSize = DEFAULT_PAGE_SIZE) {
  const items = ref<Restaurant[]>([])
  const total = ref(0)
  const page = ref(1)
  const search = ref('')
  const searchInput = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  let requestId = 0

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

  async function load(): Promise<void> {
    const id = ++requestId
    loading.value = true
    error.value = null
    try {
      const result = await getRestaurantsPage({ page: page.value, pageSize, search: search.value })
      if (id !== requestId) return // a newer page/search superseded this one
      items.value = result.items
      total.value = result.total
    } catch (e) {
      if (id !== requestId) return
      error.value = e instanceof Error ? e.message : 'Failed to load restaurants'
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  // Debounce search so we don't fetch on every keystroke; committing a term restarts from page 1.
  const commitSearch = debounce((value: string) => {
    search.value = value.trim()
    page.value = 1
    load()
  }, 300)
  watch(searchInput, (value) => commitSearch(value))

  function goToPage(next: number): void {
    const target = Math.min(Math.max(1, next), totalPages.value)
    if (target === page.value) return
    page.value = target
    load()
  }

  function reset(): void {
    requestId++ // abandon any in-flight result
    commitSearch.cancel()
    items.value = []
    total.value = 0
    page.value = 1
    search.value = ''
    searchInput.value = ''
    error.value = null
  }

  return { items, total, page, totalPages, searchInput, loading, error, load, goToPage, reset }
}
