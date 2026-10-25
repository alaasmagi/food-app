<script lang="ts">
// Exported so callers can type their option arrays.
export interface SelectOption {
  value: string
  label: string
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../Icon.vue'

// Ported from the design system's Select.d.ts. React value/onChange -> Vue v-model.
const props = withDefaults(
  defineProps<{
    label?: string
    options: SelectOption[]
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    placeholder: 'Select…',
    disabled: false,
  },
)

const model = defineModel<string>()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

const selected = computed(() => props.options.find((option) => option.value === model.value))

function toggle(): void {
  if (!props.disabled) open.value = !open.value
}

function choose(value: string): void {
  model.value = value
  open.value = false
}

function onDocumentClick(event: MouseEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="ds-select" :class="{ 'ds-select--disabled': disabled }">
    <label v-if="label" class="ds-select__label">{{ label }}</label>
    <button
      type="button"
      class="ds-select__trigger"
      :class="{ 'ds-select__trigger--open': open }"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="ds-select__value" :class="{ 'ds-select__value--placeholder': !selected }">
        {{ selected ? selected.label : placeholder }}
      </span>
      <Icon
        name="chevron-down"
        :size="20"
        class="ds-select__chevron"
        :class="{ 'ds-select__chevron--open': open }"
      />
    </button>
    <div v-if="open && !disabled" class="ds-select__list" role="listbox">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="ds-select__option"
        :class="{ 'ds-select__option--selected': option.value === model }"
        role="option"
        :aria-selected="option.value === model"
        @click="choose(option.value)"
      >
        <span>{{ option.label }}</span>
        <Icon v-if="option.value === model" name="check" :size="13" color="var(--color-accent-text)" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Figma "Select": same field as Input, chevron on the right; the open list uses the Dropdown menu surface. */
.ds-select { position: relative; display: flex; flex-direction: column; gap: var(--space-1-5); width: 100%; }
.ds-select__label { font-family: var(--font-body); font-size: 14px; line-height: 20px; font-weight: var(--weight-semibold); color: var(--color-text-secondary); }
.ds-select__trigger { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); width: 100%; text-align: left; cursor: pointer; min-height: 44px; box-sizing: border-box; padding: var(--space-2-5) var(--space-3); background: var(--color-bg-sunken); border: var(--border-thin) solid var(--color-border-default); border-radius: var(--radius-md); font-family: var(--font-body); font-size: 16px; line-height: 24px; color: var(--color-text-primary); transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
.ds-select__trigger:focus-visible, .ds-select__trigger--open { outline: none; background: var(--color-bg-surface); border-color: var(--color-accent-solid); box-shadow: 0 0 0 1px var(--color-accent-solid); }
.ds-select__value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ds-select__value--placeholder { color: var(--color-text-muted); }
.ds-select__chevron { flex-shrink: 0; color: var(--color-text-secondary); transition: transform var(--duration-fast) var(--ease-standard); }
.ds-select__chevron--open { transform: rotate(180deg); }
.ds-select--disabled .ds-select__trigger { background: var(--color-bg-canvas); border-color: var(--color-border-subtle); color: var(--color-text-disabled); cursor: not-allowed; }
.ds-select__list { position: absolute; top: calc(100% + var(--space-1)); left: 0; right: 0; z-index: 30; display: flex; flex-direction: column; gap: var(--space-0-5); max-height: 280px; overflow-y: auto; padding: var(--space-1); background: var(--color-bg-raised); border: var(--border-thin) solid var(--color-border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-md); }
.ds-select__option { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); min-height: 40px; padding: var(--space-2) var(--space-3); border: 0; border-radius: var(--radius-sm); background: none; color: var(--color-text-primary); font-family: var(--font-body); font-size: 14px; line-height: 20px; text-align: left; cursor: pointer; }
.ds-select__option:hover { background: var(--color-bg-hover); }
.ds-select__option--selected { color: var(--color-accent-text); font-weight: var(--weight-semibold); }
</style>
