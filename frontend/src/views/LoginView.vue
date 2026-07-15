<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import Button from '../components/design-system/forms/Button.vue'

const auth = useAuthStore()
</script>

<template>
  <main class="login">
    <div class="login__panel">
      <h1 class="login__title">Sign in</h1>
      <p class="login__body">Sign in with your account to continue.</p>
      <Button variant="primary" size="lg" icon="arrow-right" iconPosition="right" @click="auth.login()">
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
  gap: var(--space-4);
  align-items: flex-start;
  max-width: 360px;
  padding: var(--space-8);
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
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
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}
</style>
