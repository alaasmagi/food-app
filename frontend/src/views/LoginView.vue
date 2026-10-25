<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Button from '../components/design-system/forms/Button.vue'

const auth = useAuthStore()
const route = useRoute()

// The guarded route that bounced us here, so login returns straight to it (its guard
// then completes the token exchange). Defaults to the dashboard. Only same-app absolute
// paths are honored - reject protocol-relative "//host" values as an open-redirect guard.
const redirectTarget = computed(() => {
  const raw = route.query.redirect
  const path = typeof raw === 'string' ? raw : null
  return path && path.startsWith('/') && !path.startsWith('//') ? path : '/'
})
</script>

<template>
  <main class="login">
    <div class="login__panel">
      <div class="login__brand"><span class="login__mark" aria-hidden="true">FR</span>FoodRoulette</div>
      <div class="login__copy">
        <h1 class="login__title">Sign in</h1>
        <p class="login__body">Sign in with your account to continue.</p>
      </div>
      <Button variant="primary" icon="arrow-right" full-width @click="auth.login(redirectTarget)">
        Log in
      </Button>
    </div>
  </main>
</template>

<style scoped>
/* Figma "01 Sign in": centred card with the brand mark. */
.login { display: flex; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; padding: var(--space-6) var(--space-4); background: var(--color-bg-canvas); }
.login__panel { display: flex; flex-direction: column; gap: var(--space-6); width: 100%; max-width: 420px; box-sizing: border-box; padding: var(--space-8); border: var(--border-thin) solid var(--color-border-subtle); border-radius: var(--radius-lg); background: var(--color-bg-surface); }
.login__brand { display: flex; align-items: center; gap: var(--space-3); font-size: 18px; line-height: 24px; font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.login__mark { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--color-accent-solid); color: var(--color-text-on-accent); font-size: 12px; font-weight: var(--weight-bold); }
.login__copy { display: flex; flex-direction: column; gap: var(--space-2); }
.login__title { margin: 0; font-size: 28px; line-height: 34px; font-weight: var(--weight-bold); letter-spacing: -0.015em; color: var(--color-text-primary); }
.login__body { margin: 0; font-size: 16px; line-height: 24px; color: var(--color-text-secondary); }
</style>
