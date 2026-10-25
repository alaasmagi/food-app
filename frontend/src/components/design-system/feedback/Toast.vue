<script setup lang="ts">
import { computed } from 'vue'
import Icon, { type IconName } from '../Icon.vue'

// Prop contract ported 1:1 from the design system's Toast.d.ts. React onClose -> `close` emit.
const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    tone?: 'info' | 'success' | 'warning' | 'danger'
  }>(),
  {
    tone: 'info',
  },
)

const emit = defineEmits<{ close: [] }>()

const TONE_ICON: Record<string, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  danger: 'alert-circle',
}

const icon = computed(() => TONE_ICON[props.tone])
</script>

<template>
  <div class="ds-toast" :class="`ds-toast--${tone}`">
    <span class="ds-toast__icon">
      <Icon :name="icon" :size="20" />
    </span>
    <div class="ds-toast__body">
      <span class="ds-toast__title">{{ title }}</span>
      <span v-if="description" class="ds-toast__description">{{ description }}</span>
    </div>
    <button type="button" class="ds-toast__close" aria-label="Dismiss" @click="emit('close')">
      <Icon name="x" :size="16" />
    </button>
  </div>
</template>

<style scoped>
/* Figma "Toast": neutral raised surface, the tone only colours the icon; Shadow/md; 360px. */
.ds-toast { display: flex; align-items: flex-start; gap: var(--space-3); width: 360px; max-width: 100%; box-sizing: border-box; padding: var(--space-3) var(--space-4); background: var(--color-bg-raised); border: var(--border-thin) solid var(--color-border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-md); font-family: var(--font-body); }
.ds-toast__icon { display: inline-flex; padding-top: 2px; }
.ds-toast--info .ds-toast__icon { color: var(--color-status-info-text); }
.ds-toast--success .ds-toast__icon { color: var(--color-status-success-text); }
.ds-toast--warning .ds-toast__icon { color: var(--color-status-warning-text); }
.ds-toast--danger .ds-toast__icon { color: var(--color-status-danger-text); }
.ds-toast__body { display: flex; flex-direction: column; gap: var(--space-0-5); flex: 1; min-width: 0; }
.ds-toast__title { font-size: 14px; line-height: 20px; font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.ds-toast__description { font-size: 14px; line-height: 20px; color: var(--color-text-secondary); }
.ds-toast__close { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: var(--radius-xs); background: none; color: var(--color-text-secondary); cursor: pointer; }
.ds-toast__close:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
</style>
