<script setup lang="ts">
import { computed } from 'vue'
import Tabs, { type TabItem } from '../design-system/navigation/Tabs.vue'
import { useEnvironmentsStore } from '../../stores/environments'

const store = useEnvironmentsStore()

// Sentinel value for the fixed "All" tab, mapped to the store's null selection.
const ALL = 'all'

const tabs = computed<TabItem[]>(() => [
  { value: ALL, label: 'All' },
  ...store.list.map((environment) => ({ value: environment.id, label: environment.name })),
])

const selected = computed<string>({
  get: () => store.selectedEnvironmentId ?? ALL,
  set: (value) => store.selectEnvironment(value === ALL ? null : value),
})
</script>

<template>
  <Tabs v-model="selected" :tabs="tabs" />
</template>
