<script setup lang="ts">
import Icon from '../Icon.vue'

// Ported from the design system's Dialog.d.ts. React onClose -> `close` emit;
// children/footer -> default and `footer` slots. Uses a page-level fixed overlay
// so it covers the viewport regardless of the mount container.
withDefaults(
  defineProps<{
    open: boolean
    title?: string
    width?: string
  }>(),
  {
    width: '420px',
  },
)

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Transition name="ds-dialog">
    <div v-if="open" class="ds-dialog__overlay" @click.self="emit('close')">
      <div class="ds-dialog__panel" :style="{ width }">
        <div class="ds-dialog__head">
          <span class="ds-dialog__title">{{ title }}</span>
          <button type="button" class="ds-dialog__close" aria-label="Close" @click="emit('close')">
            <Icon name="x" :size="16" />
          </button>
        </div>
        <div class="ds-dialog__body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="ds-dialog__footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.ds-dialog__overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: var(--surface-overlay);
}

.ds-dialog__panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 90%;
  padding: 20px;
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.ds-dialog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ds-dialog__title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.ds-dialog__close {
  display: flex;
  padding: 0;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-standard);
}

.ds-dialog__close:hover {
  color: var(--text-primary);
}

.ds-dialog__body {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

.ds-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

/* Open/close transition (Vue Transition, not JS handlers). */
.ds-dialog-enter-active,
.ds-dialog-leave-active {
  transition: opacity var(--duration-normal) var(--ease-standard);
}

.ds-dialog-enter-active .ds-dialog__panel,
.ds-dialog-leave-active .ds-dialog__panel {
  transition: transform var(--duration-normal) var(--ease-standard);
}

.ds-dialog-enter-from,
.ds-dialog-leave-to {
  opacity: 0;
}

.ds-dialog-enter-from .ds-dialog__panel,
.ds-dialog-leave-to .ds-dialog__panel {
  transform: translateY(8px) scale(0.98);
}
</style>
