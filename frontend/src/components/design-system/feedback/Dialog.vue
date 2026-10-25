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
    width: '440px',
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
            <Icon name="x" :size="20" />
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
/* Figma "Dialog": bg/raised, border/subtle, radius/lg, Shadow/lg, 24px padding; Desktop/H3 title, ghost close button. */
.ds-dialog__overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: var(--space-4); background: var(--color-overlay-scrim); }
.ds-dialog__panel { display: flex; flex-direction: column; gap: var(--space-4); max-width: 100%; max-height: calc(100vh - 2 * var(--space-4)); box-sizing: border-box; padding: var(--space-6); overflow-y: auto; background: var(--color-bg-raised); border: var(--border-thin) solid var(--color-border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); color: var(--color-text-primary); }
.ds-dialog__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
.ds-dialog__title { font-family: var(--font-body); font-size: 22px; line-height: 28px; font-weight: var(--weight-semibold); letter-spacing: -0.005em; }
.ds-dialog__close { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 44px; height: 44px; border: 0; border-radius: var(--radius-md); background: none; color: var(--color-text-secondary); cursor: pointer; }
.ds-dialog__close:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
.ds-dialog__body { display: flex; flex-direction: column; gap: var(--space-4); font-family: var(--font-body); font-size: 16px; line-height: 24px; color: var(--color-text-secondary); }
.ds-dialog__footer { display: flex; justify-content: flex-end; gap: var(--space-2); padding-top: var(--space-1); }
.ds-dialog-enter-active, .ds-dialog-leave-active { transition: opacity var(--duration-normal) var(--ease-out); }
.ds-dialog-enter-from, .ds-dialog-leave-to { opacity: 0; }
</style>
