<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import WheelSpinner from '../components/wheel/WheelSpinner.vue'
import Button from '../components/design-system/forms/Button.vue'
import Switch from '../components/design-system/forms/Switch.vue'
import WinnerPanel from '../components/wheel/WinnerPanel.vue'
import { getPublicWheel } from '../api/publicWheels'
import { useTheme } from '../composables/useTheme'
import type { PublicWheel } from '../types/wheel'

const route = useRoute()
const { theme, setTheme } = useTheme()
const dark = computed({
  get: () => theme.value === 'dark',
  set: (value: boolean) => setTheme(value ? 'dark' : 'light'),
})

// Winner + "Spin again" (Figma "10 Shared wheel"); offers and ratings need an account, so the
// public page shows only the name and a call to create your own wheel.
const spinner = ref<InstanceType<typeof WheelSpinner> | null>(null)
const winner = ref<string | null>(null)
function spinAgain(): void {
  winner.value = null
  requestAnimationFrame(() => spinner.value?.spin())
}

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
    <header class="shared-wheel__bar">
      <RouterLink to="/" class="shared-wheel__brand" aria-label="FoodRoulette">
        <span class="shared-wheel__mark" aria-hidden="true">FR</span>
        <span>FoodRoulette</span>
      </RouterLink>
      <Switch v-model="dark" label="Dark mode" />
    </header>
    <p v-if="status === 'loading'" class="shared-wheel__status">Loading…</p>
    <div v-else-if="status === 'loaded' && wheel" class="shared-wheel__content">
      <div class="shared-wheel__wheel">
        <h1 class="shared-wheel__title">{{ wheel.name }}</h1>
        <WheelSpinner
          ref="spinner"
          :names="wheel.restaurantNames"
          hide-result
          :hide-controls="!!winner"
          @result="winner = $event"
        />
      </div>
      <div v-if="winner" class="shared-wheel__side">
        <WinnerPanel :name="winner" :with-details="false" @spin-again="spinAgain" />
        <div class="shared-wheel__cta">
          <h2 class="shared-wheel__cta-title">Make your own lunch wheel</h2>
          <p class="shared-wheel__cta-text">
            Pick restaurants near you, see today’s offers and share the wheel with your team.
          </p>
          <RouterLink to="/login" custom v-slot="{ navigate }">
            <Button variant="primary" icon="arrow-right" full-width @click="navigate">Create your own wheel</Button>
          </RouterLink>
        </div>
      </div>
    </div>
    <p v-else-if="status === 'not-found'" class="shared-wheel__status">
      This wheel isn't available.
    </p>
    <p v-else class="shared-wheel__status">Something went wrong. Please try again.</p>
  </main>
</template>

<style scoped>
/* Figma "Desktop / 10 Shared wheel": public page, top bar, wheel + winner + call to action. */
.shared-wheel { min-height: 100vh; box-sizing: border-box; background: var(--color-bg-canvas); }
.shared-wheel__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); padding: var(--space-4) var(--space-6); }
.shared-wheel__brand { display: flex; align-items: center; gap: var(--space-3); color: var(--color-text-primary); font-size: 14px; line-height: 20px; font-weight: var(--weight-semibold); text-decoration: none; }
.shared-wheel__mark { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--color-accent-solid); color: var(--color-text-on-accent); font-size: 12px; font-weight: var(--weight-bold); }
.shared-wheel__content { display: flex; flex-wrap: wrap; justify-content: center; align-items: flex-start; gap: var(--space-12); padding: var(--space-10) var(--space-4); }
.shared-wheel__wheel { display: flex; flex-direction: column; align-items: center; gap: var(--space-6); width: min(440px, 100%); }
.shared-wheel__title { margin: 0; font-size: 36px; line-height: 44px; font-weight: var(--weight-bold); letter-spacing: -0.015em; color: var(--color-text-primary); text-align: center; }
.shared-wheel__side { display: flex; flex-direction: column; gap: var(--space-4); width: min(380px, 100%); padding-top: 72px; }
.shared-wheel__cta { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-5); border: var(--border-thin) solid var(--color-border-subtle); border-radius: var(--radius-lg); background: var(--color-bg-sunken); }
.shared-wheel__cta-title { margin: 0; font-size: 18px; line-height: 24px; font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.shared-wheel__cta-text { margin: 0; font-size: 14px; line-height: 20px; color: var(--color-text-secondary); }
.shared-wheel__status { margin: 0; padding: var(--space-16) var(--space-6); text-align: center; font-size: 16px; line-height: 24px; color: var(--color-text-secondary); }
@media (max-width: 599px) {
  .shared-wheel__title { font-size: 28px; line-height: 34px; }
  .shared-wheel__side { padding-top: 0; }
}
</style>
