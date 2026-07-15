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
      <Icon :name="icon" :size="16" />
    </span>
    <div class="ds-toast__body">
      <span class="ds-toast__title">{{ title }}</span>
      <span v-if="description" class="ds-toast__description">{{ description }}</span>
    </div>
    <button type="button" class="ds-toast__close" aria-label="Dismiss" @click="emit('close')">
      <Icon name="x" :size="13" />
    </button>
  </div>
</template>

<style scoped>
.ds-toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 320px;
  padding: 13px 14px;
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.ds-toast__icon {
  display: flex;
  margin-top: 1px;
}

.ds-toast--info .ds-toast__icon {
  color: var(--accent-9);
}

.ds-toast--success .ds-toast__icon {
  color: var(--status-success);
}

.ds-toast--warning .ds-toast__icon {
  color: var(--status-warning);
}

.ds-toast--danger .ds-toast__icon {
  color: var(--status-danger);
}

.ds-toast__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.ds-toast__title {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.ds-toast__description {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.ds-toast__close {
  display: flex;
  margin-top: 1px;
  padding: 0;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-standard);
}

.ds-toast__close:hover {
  color: var(--text-primary);
}
</style>
