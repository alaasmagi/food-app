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
.ds-tabs {
  display: flex;
  gap: 4px;
  /* Scroll horizontally when the tabs overflow, but never vertically: setting
     overflow-x alone makes overflow-y compute to auto, and the active tab's 2px
     underline overflows by a sub-pixel, which would surface a stray vertical
     scrollbar. Chrome is hidden — the tab strip scrolls without a visible bar. */
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  border-bottom: 1px solid var(--border-subtle);
}

.ds-tabs::-webkit-scrollbar {
  display: none;
}

.ds-tabs__tab {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-bottom: -1px;
  padding: 10px 4px;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-standard);
}

.ds-tabs__tab:hover {
  color: var(--text-primary);
}

.ds-tabs__tab--active {
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  border-bottom-color: var(--accent-7);
}
</style>
