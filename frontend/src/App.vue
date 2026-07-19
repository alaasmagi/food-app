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
:root,
:root[data-theme='dark'] {
  color-scheme: dark;
}

:root[data-theme='light'] {
  color-scheme: light;
}

html,
body,
#app {
  margin: 0;
  min-height: 100vh;
}

/* Always reserve the vertical scrollbar's gutter so pages that grow past the
   viewport don't claim width from the centered layout and shift it sideways.
   No-op on overlay-scrollbar systems; prevents the jump on classic scrollbars. */
html {
  scrollbar-gutter: stable;
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
