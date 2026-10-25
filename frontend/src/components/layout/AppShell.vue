<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useTheme } from '../../composables/useTheme'
import Icon, { type IconName } from '../design-system/Icon.vue'
import Switch from '../design-system/forms/Switch.vue'

// Figma "Desktop shell": 272px sidebar (brand, navigation, theme switch, user row) next to the
// page. Below 960px the sidebar collapses into a top bar with a menu button.
const auth = useAuthStore()
const { theme, setTheme } = useTheme()
const route = useRoute()

const nav: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Dashboard', icon: 'home' },
  { to: '/places', label: 'Places', icon: 'map-pin' },
  { to: '/wheel', label: 'Wheel', icon: 'pie-chart' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

const dark = computed({
  get: () => theme.value === 'dark',
  set: (value: boolean) => setTheme(value ? 'dark' : 'light'),
})

const menuOpen = ref(false)
watch(
  () => route?.fullPath,
  () => (menuOpen.value = false),
)

const userLabel = computed(() => auth.currentUser?.email ?? auth.currentUser?.username ?? '')

function isActive(to: string): boolean {
  const path = route?.path ?? '/'
  return to === '/' ? path === '/' : path === to || path.startsWith(`${to}/`)
}
</script>

<template>
  <div class="shell">
    <aside class="shell__sidebar" :class="{ 'shell__sidebar--open': menuOpen }">
      <div class="shell__top">
        <RouterLink to="/" class="shell__brand" aria-label="FoodRoulette — home">
          <span class="shell__mark" aria-hidden="true">FR</span>
          <span>FoodRoulette</span>
        </RouterLink>
        <button
          type="button"
          class="shell__menu"
          :aria-expanded="menuOpen"
          aria-label="Toggle navigation"
          @click="menuOpen = !menuOpen"
        >
          <Icon name="menu" :size="20" />
        </button>
      </div>

      <nav class="shell__nav" aria-label="Main">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="shell__nav-link"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <Icon :name="item.icon" :size="20" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="shell__spacer" />

      <div class="shell__footer">
        <Switch v-model="dark" label="Dark mode" />
        <div class="shell__user">
          <span class="shell__user-email" :title="userLabel">{{ userLabel }}</span>
          <button type="button" class="shell__logout" aria-label="Log out" title="Log out" @click="auth.logout()">
            <Icon name="log-out" :size="20" />
          </button>
        </div>
      </div>
    </aside>
    <main class="shell__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell { display: grid; grid-template-columns: 272px minmax(0, 1fr); min-height: 100vh; }
.shell__sidebar { position: sticky; top: 0; display: flex; flex-direction: column; gap: var(--space-1); height: 100vh; box-sizing: border-box; padding: var(--space-6) var(--space-5); background: var(--color-bg-surface); border-right: var(--border-thin) solid var(--color-border-subtle); overflow-y: auto; }
.shell__top { display: flex; align-items: center; justify-content: space-between; }
.shell__brand { display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-2) var(--space-5); color: var(--color-text-primary); font-size: 16px; line-height: 24px; font-weight: var(--weight-semibold); text-decoration: none; }
.shell__mark { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--color-accent-solid); color: var(--color-text-on-accent); font-size: 12px; font-weight: var(--weight-bold); }
.shell__menu { display: none; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0; border-radius: var(--radius-md); background: none; color: var(--color-text-primary); cursor: pointer; }
.shell__nav { display: flex; flex-direction: column; gap: var(--space-1); }
.shell__nav-link { display: flex; align-items: center; gap: var(--space-3); min-height: 40px; padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); color: var(--color-text-secondary); font-size: 14px; line-height: 20px; font-weight: var(--weight-semibold); text-decoration: none; }
.shell__nav-link:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
.shell__nav-link[aria-current='page'] { background: var(--color-accent-subtle); color: var(--color-accent-text); }
.shell__spacer { flex: 1; min-height: var(--space-6); }
.shell__footer { display: flex; flex-direction: column; gap: var(--space-2); padding-left: var(--space-2); }
.shell__user { display: flex; align-items: center; gap: var(--space-2); }
.shell__user-email { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; line-height: 20px; color: var(--color-text-secondary); }
.shell__logout { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0; border-radius: var(--radius-md); background: none; color: var(--color-text-secondary); cursor: pointer; }
.shell__logout:hover, .shell__menu:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
.shell__main { min-width: 0; padding: var(--space-10) var(--space-12) var(--space-16); }

@media (max-width: 959px) {
  .shell { grid-template-columns: 1fr; }
  .shell__sidebar { z-index: 20; height: auto; padding: var(--space-3) var(--space-4); border-right: 0; border-bottom: var(--border-thin) solid var(--color-border-subtle); }
  .shell__brand { padding: 0; }
  .shell__menu { display: inline-flex; }
  .shell__nav, .shell__spacer, .shell__footer { display: none; }
  .shell__sidebar--open .shell__nav, .shell__sidebar--open .shell__footer { display: flex; }
  .shell__sidebar--open .shell__nav { padding-top: var(--space-3); }
  .shell__sidebar--open .shell__footer { padding-top: var(--space-4); }
  .shell__main { padding: var(--space-6) var(--space-4) var(--space-10); }
}
</style>
