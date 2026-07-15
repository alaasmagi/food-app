<script setup lang="ts">
import { useToastsStore } from '../../stores/toasts'
import Toast from '../design-system/feedback/Toast.vue'

const toasts = useToastsStore()
</script>

<template>
  <div class="toast-host">
    <TransitionGroup name="toast">
      <Toast
        v-for="toast in toasts.items"
        :key="toast.id"
        :title="toast.title"
        :description="toast.description"
        :tone="toast.tone"
        @close="toasts.dismiss(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  right: var(--space-6);
  bottom: var(--space-6);
  /* Above the Dialog overlay (z 100) so save toasts show over the editor. */
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--duration-normal) var(--ease-standard),
    transform var(--duration-normal) var(--ease-standard);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
