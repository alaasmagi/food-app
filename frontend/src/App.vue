<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from './components/layout/AppShell.vue'
import ToastHost from './components/notifications/ToastHost.vue'

const route = useRoute()
// Public routes (login) render without the authenticated shell chrome.
const isPublic = computed(() => route.meta.public === true)
</script>

<template>
  <AppShell v-if="!isPublic">
    <RouterView />
  </AppShell>
  <RouterView v-else />
  <ToastHost />
</template>

<style>
:root {
  color-scheme: dark;
}

html,
body,
#app {
  margin: 0;
  min-height: 100vh;
}

body {
  background: var(--surface-app);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
</style>
