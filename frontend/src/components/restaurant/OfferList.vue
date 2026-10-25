<script setup lang="ts">
import { computed } from 'vue'
import { useRestaurantsStore } from '../../stores/restaurants'

// Today's offers for one restaurant (Figma: offer text + price per row). `limit` shows only the
// first N rows; the caller renders the "+N more" toggle.
const props = defineProps<{ restaurantId: string; limit?: number }>()
const store = useRestaurantsStore()
const entry = computed(() => store.offersFor(props.restaurantId))
const visible = computed(() => {
  const offers = entry.value?.offers ?? []
  return props.limit ? offers.slice(0, props.limit) : offers
})
</script>

<template>
  <div class="offers">
    <p v-if="entry?.loading" class="offers__status">Loading offers.</p>
    <p v-else-if="entry?.error" class="offers__status offers__status--error">
      Offers could not be loaded.
    </p>
    <ul v-else-if="entry && entry.offers.length" class="offers__list">
      <li v-for="(offer, index) in visible" :key="index" class="offers__item">
        <span class="offers__text">{{ offer.offerText }}</span>
        <span v-if="offer.offerPrice" class="offers__price">{{ offer.offerPrice }}</span>
      </li>
    </ul>
    <p v-else class="offers__status">No offers available.</p>
  </div>
</template>

<style scoped>
.offers { font-family: var(--font-body); }
.offers__list { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.offers__item { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-4); padding: var(--space-2) 0; font-size: 16px; line-height: 24px; color: var(--color-text-primary); }
.offers__item + .offers__item { border-top: var(--border-thin) solid var(--color-border-subtle); }
.offers__price { flex-shrink: 0; font-size: 14px; line-height: 20px; font-weight: var(--weight-semibold); white-space: nowrap; }
.offers__status { margin: 0; padding: var(--space-2) 0; font-size: 14px; line-height: 20px; color: var(--color-text-muted); }
.offers__status--error { color: var(--color-status-danger-text); }
</style>
