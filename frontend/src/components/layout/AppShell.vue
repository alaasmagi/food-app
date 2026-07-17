<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'
import { useTheme } from '../../composables/useTheme'
import Button from '../design-system/forms/Button.vue'

const auth = useAuthStore()
const { theme, toggleTheme } = useTheme()
</script>

<template>
  <div class="shell">
    <header class="shell__header">
      <div class="shell__lead">
        <span class="shell__brand">Food app</span>
        <nav class="shell__nav">
          <RouterLink to="/" class="shell__nav-link">Dashboard</RouterLink>
          <RouterLink to="/wheel" class="shell__nav-link">Wheel</RouterLink>
          <RouterLink to="/settings" class="shell__nav-link">Settings</RouterLink>
        </nav>
      </div>
      <div class="shell__actions">
        <Button
          variant="ghost"
          size="sm"
          :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          {{ theme === 'dark' ? 'Light' : 'Dark' }}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon="arrow-right"
          iconPosition="right"
          @click="auth.logout()"
        >
          Log out
        </Button>
      </div>
    </header>
    <main class="shell__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  background: var(--surface-app);
}

.shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  background: var(--surface-raised);
  border-bottom: 1px solid var(--border-subtle);
}

.shell__lead {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.shell__brand {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

.shell__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.shell__nav {
  display: flex;
  gap: var(--space-5);
}

.shell__nav-link {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-standard);
}

.shell__nav-link:hover {
  color: var(--text-primary);
}

.shell__nav-link.router-link-exact-active {
  color: var(--text-primary);
}
</style>
