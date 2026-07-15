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
        :size="14"
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
        <Icon v-if="option.value === model" name="check" :size="13" color="var(--accent-7)" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.ds-select {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.ds-select__label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.ds-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  padding: 9px 10px;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-primary);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}

.ds-select__trigger--open {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.ds-select__value--placeholder {
  color: var(--text-secondary);
}

.ds-select__chevron {
  flex-shrink: 0;
  transition: transform var(--duration-fast) var(--ease-standard);
}

.ds-select__chevron--open {
  transform: rotate(180deg);
}

.ds-select--disabled .ds-select__trigger {
  color: var(--text-disabled);
  background: var(--neutral-1);
  cursor: not-allowed;
}

.ds-select__list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.ds-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 8px;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-primary);
  text-align: left;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.ds-select__option:hover,
.ds-select__option--selected {
  background: var(--surface-hover);
}
</style>
