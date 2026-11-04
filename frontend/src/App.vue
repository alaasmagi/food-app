<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from './components/layout/AppShell.vue'
import ToastHost from './components/notifications/ToastHost.vue'

const route = useRoute()
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

/* Reserve the scrollbar gutter so pages growing past the viewport don't shift the centred layout. */
html {
  scrollbar-gutter: stable;
}

.visually-hidden {
  position: absolute !important;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

body {
  line-height: 24px;
  background: var(--surface-app);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
</style>
