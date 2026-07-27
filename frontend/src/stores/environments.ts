import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  addRestaurantToEnvironment,
  autoFillEnvironment,
  createEnvironment as apiCreate,
  deleteEnvironment as apiDelete,
  getEnvironmentRestaurants,
  getEnvironments,
  removeRestaurantFromEnvironment,
  updateEnvironment as apiUpdate,
  type DiningEnvironmentAutoFillResult,
  type EnvironmentInput,
} from '../api/environments'
import type { DiningEnvironment } from '../types/environment'

/** A restaurant's membership in one environment: the join row's id + token, needed to delete it. */
export interface MembershipRef {
  joinId: string
  concurrencyToken: string
}

export const useEnvironmentsStore = defineStore('environments', () => {
  const list = ref<DiningEnvironment[]>([])
  // null = "All" (no environment filter).
  const selectedEnvironmentId = ref<string | null>(null)
  // envId -> restaurantId -> join row ref.
  const membershipByEnv = ref<Record<string, Record<string, MembershipRef>>>({})
  // restaurant ids with an add/remove request in flight (guards double submits).
  const pending = ref<Set<string>>(new Set())

  let listLoaded = false
  let membershipLoaded = false

  async function loadEnvironments(): Promise<void> {
    if (listLoaded) return
    list.value = await getEnvironments()
    listLoaded = true
  }

  async function loadMembership(): Promise<void> {
    if (membershipLoaded) return
    const rows = await getEnvironmentRestaurants()
    const index: Record<string, Record<string, MembershipRef>> = {}
    for (const row of rows) {
      ;(index[row.environmentId] ??= {})[row.restaurantId] = {
        joinId: row.id,
        concurrencyToken: row.concurrencyToken,
      }
    }
    membershipByEnv.value = index
    membershipLoaded = true
  }

  function selectEnvironment(id: string | null): void {
    selectedEnvironmentId.value = id
  }

  /** Whether a restaurant belongs to the currently selected environment ("All" -> false). */
  function isMember(restaurantId: string): boolean {
    const envId = selectedEnvironmentId.value
    if (!envId) return false
    return Boolean(membershipByEnv.value[envId]?.[restaurantId])
  }

  function isPending(restaurantId: string): boolean {
    return pending.value.has(restaurantId)
  }

  async function createEnvironment(input: EnvironmentInput): Promise<DiningEnvironment> {
    const created = await apiCreate(input)
    list.value = [...list.value, created]
    return created
  }

  async function renameEnvironment(id: string, input: EnvironmentInput): Promise<void> {
    const target = list.value.find((e) => e.id === id)
    if (!target) return
    // Default the auto-fill origin to the stored values so a plain rename (which sends only
    // name/description) never drops a saved location. Any auto-fill fields the caller supplies
    // (including an explicit null to clear the origin) override these defaults.
    const payload: EnvironmentInput = {
      autoFillLatitude: target.autoFillLatitude,
      autoFillLongitude: target.autoFillLongitude,
      autoFillRadiusMeters: target.autoFillRadiusMeters,
      ...input,
    }
    const updated = await apiUpdate(id, payload, target.concurrencyToken)
    list.value = list.value.map((e) => (e.id === id ? updated : e))
  }

  /**
   * Trigger the backend proximity import for an environment that has a stored origin, then refresh
   * membership so the newly added join rows (needed to render/toggle membership) are reflected.
   * Returns the summary so the caller can report how many were added.
   */
  async function autoFill(id: string): Promise<DiningEnvironmentAutoFillResult> {
    const result = await autoFillEnvironment(id)
    membershipLoaded = false
    await loadMembership()
    return result
  }

  async function deleteEnvironment(id: string): Promise<void> {
    const target = list.value.find((e) => e.id === id)
    if (!target) return
    await apiDelete(id, target.concurrencyToken)
    list.value = list.value.filter((e) => e.id !== id)
    delete membershipByEnv.value[id]
    if (selectedEnvironmentId.value === id) {
      selectedEnvironmentId.value = null
    }
  }

  async function addRestaurant(restaurantId: string): Promise<void> {
    const envId = selectedEnvironmentId.value
    if (!envId || pending.value.has(restaurantId)) return
    pending.value.add(restaurantId)
    try {
      const row = await addRestaurantToEnvironment(envId, restaurantId)
      ;(membershipByEnv.value[envId] ??= {})[restaurantId] = {
        joinId: row.id,
        concurrencyToken: row.concurrencyToken,
      }
    } finally {
      pending.value.delete(restaurantId)
    }
  }

  async function removeRestaurant(restaurantId: string): Promise<void> {
    const envId = selectedEnvironmentId.value
    if (!envId || pending.value.has(restaurantId)) return
    const ref = membershipByEnv.value[envId]?.[restaurantId]
    if (!ref) return
    pending.value.add(restaurantId)
    try {
      await removeRestaurantFromEnvironment(ref.joinId, ref.concurrencyToken)
      delete membershipByEnv.value[envId][restaurantId]
    } finally {
      pending.value.delete(restaurantId)
    }
  }

  return {
    list,
    selectedEnvironmentId,
    membershipByEnv,
    loadEnvironments,
    loadMembership,
    selectEnvironment,
    isMember,
    isPending,
    createEnvironment,
    renameEnvironment,
    deleteEnvironment,
    autoFill,
    addRestaurant,
    removeRestaurant,
  }
})
