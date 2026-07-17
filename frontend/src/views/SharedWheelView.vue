<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import WheelSpinner from '../components/wheel/WheelSpinner.vue'
import { getPublicWheel } from '../api/publicWheels'
import type { PublicWheel } from '../types/wheel'

const route = useRoute()

type Status = 'loading' | 'loaded' | 'not-found' | 'error'

const status = ref<Status>('loading')
const wheel = ref<PublicWheel | null>(null)

onMounted(async () => {
  const id = String(route.params.id)
  try {
    const result = await getPublicWheel(id)
    if (result) {
      wheel.value = result
      status.value = 'loaded'
    } else {
      status.value = 'not-found'
    }
  } catch {
    status.value = 'error'
  }
})
</script>

<template>
  <main class="shared-wheel">
    <p v-if="status === 'loading'" class="shared-wheel__status">Loading…</p>

    <template v-else-if="status === 'loaded' && wheel">
      <h1 class="shared-wheel__title">{{ wheel.name }}</h1>
      <WheelSpinner :names="wheel.restaurantNames" />
    </template>

    <p v-else-if="status === 'not-found'" class="shared-wheel__status">
      This wheel isn't available.
    </p>

    <p v-else class="shared-wheel__status">Something went wrong. Please try again.</p>
  </main>
</template>

<style scoped>
.shared-wheel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  max-width: 480px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}

.shared-wheel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  text-align: center;
}

.shared-wheel__status {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-secondary);
}
</style>
