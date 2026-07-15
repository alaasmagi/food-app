import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createWheel as apiCreate,
  deleteWheel as apiDelete,
  getWheels,
  updateWheel as apiUpdate,
  type WheelInput,
} from '../api/wheels'
import type { UserWheel } from '../types/wheel'

export const useWheelsStore = defineStore('wheels', () => {
  const list = ref<UserWheel[]>([])
  let loaded = false

  async function loadWheels(): Promise<void> {
    if (loaded) return
    list.value = await getWheels()
    loaded = true
  }

  async function createWheel(input: WheelInput): Promise<void> {
    const created = await apiCreate(input)
    list.value = [...list.value, created]
  }

  async function updateWheel(id: string, input: WheelInput): Promise<void> {
    const target = list.value.find((wheel) => wheel.id === id)
    if (!target) return
    const updated = await apiUpdate(id, input, target.concurrencyToken)
    list.value = list.value.map((wheel) => (wheel.id === id ? updated : wheel))
  }

  async function deleteWheel(id: string): Promise<void> {
    const target = list.value.find((wheel) => wheel.id === id)
    if (!target) return
    await apiDelete(id, target.concurrencyToken)
    list.value = list.value.filter((wheel) => wheel.id !== id)
  }

  return { list, loadWheels, createWheel, updateWheel, deleteWheel }
})
