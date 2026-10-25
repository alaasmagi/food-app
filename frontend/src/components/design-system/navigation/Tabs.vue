<script lang="ts">
// Exported from a plain <script> block so callers can type their tab arrays.
export interface TabItem {
  value: string
  label: string
}
</script>

<script setup lang="ts">
// Ported from the design system's Tabs.d.ts. React value/onChange -> Vue v-model.
defineProps<{ tabs: TabItem[] }>()

const model = defineModel<string>()
</script>

<template>
  <div class="ds-tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      role="tab"
      class="ds-tabs__tab"
      :class="{ 'ds-tabs__tab--active': tab.value === model }"
      :aria-selected="tab.value === model"
      @click="model = tab.value"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
/* Figma "Tabs": Label/Default, active tab = text/primary with a 2px accent underline. */
/* The divider is an inset shadow (not a border) so the active underline can sit on it at bottom: 0;
   an underline hanging below the box made overflow-x: auto also scroll vertically. Horizontal overflow
   still scrolls by swipe/trackpad, with the scrollbar hidden. */
.ds-tabs { display: flex; gap: var(--space-1); box-shadow: inset 0 calc(-1 * var(--border-thin)) 0 var(--color-border-subtle); overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
.ds-tabs::-webkit-scrollbar { display: none; }
.ds-tabs__tab { position: relative; min-height: 44px; padding: var(--space-2-5) var(--space-3); border: 0; background: none; color: var(--color-text-secondary); font-family: var(--font-body); font-size: 14px; line-height: 20px; font-weight: var(--weight-semibold); white-space: nowrap; cursor: pointer; transition: color var(--duration-fast) var(--ease-standard); }
.ds-tabs__tab:hover { color: var(--color-text-primary); }
.ds-tabs__tab--active { color: var(--color-text-primary); }
.ds-tabs__tab--active::after { content: ''; position: absolute; left: var(--space-3); right: var(--space-3); bottom: 0; height: var(--border-thick); border-radius: var(--radius-full); background: var(--color-accent-solid); }
.ds-tabs__tab:focus-visible { outline: var(--border-thick) solid var(--color-focus-ring); outline-offset: -2px; border-radius: var(--radius-sm); }
</style>
