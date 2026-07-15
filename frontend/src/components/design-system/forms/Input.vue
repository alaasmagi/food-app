<script setup lang="ts">
import Icon, { type IconName } from '../Icon.vue'

// Prop contract ported 1:1 from the design system's Input.d.ts. React's
// value/onChange are translated to Vue v-model.
withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    type?: string
    icon?: IconName
    error?: string
    hint?: string
    disabled?: boolean
    size?: 'sm' | 'md'
    /** Renders a <textarea> instead of <input>. Default false. */
    multiline?: boolean
    rows?: number
  }>(),
  {
    type: 'text',
    disabled: false,
    size: 'md',
    multiline: false,
    rows: 3,
  },
)

const model = defineModel<string>({ default: '' })
</script>

<template>
  <div class="ds-input">
    <label v-if="label" class="ds-input__label">{{ label }}</label>
    <div class="ds-input__wrap">
      <span v-if="icon && !multiline" class="ds-input__icon">
        <Icon :name="icon" :size="14" />
      </span>
      <textarea
        v-if="multiline"
        v-model="model"
        class="ds-input__field ds-input__field--textarea"
        :class="[`ds-input__field--${size}`, { 'ds-input__field--error': error }]"
        :placeholder="placeholder"
        :rows="rows"
        :disabled="disabled"
      />
      <input
        v-else
        v-model="model"
        class="ds-input__field"
        :class="[
          `ds-input__field--${size}`,
          { 'ds-input__field--error': error, 'ds-input__field--with-icon': icon },
        ]"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
      />
    </div>
    <span v-if="error || hint" class="ds-input__msg" :class="{ 'ds-input__msg--error': error }">
      {{ error || hint }}
    </span>
  </div>
</template>

<style scoped>
.ds-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.ds-input__label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.ds-input__wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.ds-input__icon {
  position: absolute;
  left: 10px;
  display: flex;
  color: var(--text-secondary);
  pointer-events: none;
}

.ds-input__field {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 10px;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-primary);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  outline: none;
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}

.ds-input__field--sm {
  padding: 6px 10px;
  font-size: var(--text-xs);
}

.ds-input__field--with-icon {
  padding-left: 32px;
}

.ds-input__field--textarea {
  resize: vertical;
}

.ds-input__field:focus {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.ds-input__field--error,
.ds-input__field--error:focus {
  border-color: var(--status-danger);
  box-shadow: none;
}

.ds-input__field:disabled {
  color: var(--text-disabled);
  background: var(--neutral-1);
  cursor: not-allowed;
}

.ds-input__msg {
  font-family: var(--font-body);
  font-size: var(--text-2xs);
  color: var(--text-secondary);
}

.ds-input__msg--error {
  color: var(--status-danger);
}
</style>
