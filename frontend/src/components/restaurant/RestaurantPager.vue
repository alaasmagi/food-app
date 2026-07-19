<script setup lang="ts">
import Button from '../design-system/forms/Button.vue'

// Prev/next pager shared by the paged restaurant pickers. Renders nothing when there's a single page.
defineProps<{ page: number; totalPages: number }>()
const emit = defineEmits<{ go: [page: number] }>()
</script>

<template>
  <div v-if="totalPages > 1" class="pager">
    <Button variant="secondary" size="sm" :disabled="page <= 1" @click="emit('go', page - 1)">
      Previous
    </Button>
    <span class="pager__label">Page {{ page }} of {{ totalPages }}</span>
    <Button
      variant="secondary"
      size="sm"
      icon="arrow-right"
      iconPosition="right"
      :disabled="page >= totalPages"
      @click="emit('go', page + 1)"
    >
      Next
    </Button>
  </div>
</template>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.pager__label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
</style>
