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
      <h1 class="login__title">Sign in</h1>
      <p class="login__body">Sign in with your account to continue.</p>
      <Button variant="primary" size="lg" icon="arrow-right" iconPosition="right" @click="auth.login(redirectTarget)">
        Log in
      </Button>
    </div>
  </main>
</template>

<style scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-6);
  background: var(--surface-app);
}

.login__panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: flex-start;
  width: 100%;
  max-width: 380px;
  padding: var(--space-10);
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}

.login__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

.login__body {
  margin: 0 0 var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}
</style>
