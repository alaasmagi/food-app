<script setup lang="ts">
import { computed } from 'vue'
import { useRestaurantsStore } from '../../stores/restaurants'

const props = defineProps<{ restaurantId: string }>()
const store = useRestaurantsStore()
const entry = computed(() => store.offersFor(props.restaurantId))
</script>

<template>
  <div class="offers">
    <p v-if="entry?.loading" class="offers__status">Loading offers.</p>
    <p v-else-if="entry?.error" class="offers__status offers__status--error">
      Offers could not be loaded.
    </p>
    <ul v-else-if="entry && entry.offers.length" class="offers__list">
      <li v-for="(offer, index) in entry.offers" :key="index" class="offers__item">
        <span class="offers__text">{{ offer.offerText }}</span>
        <span v-if="offer.offerPrice" class="offers__price">{{ offer.offerPrice }}</span>
      </li>
    </ul>
    <p v-else class="offers__status">No offers available.</p>
  </div>
</template>

<style scoped>
.offers {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.offers__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.offers__item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
}

.offers__price {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--price);
}

.offers__status {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.offers__status--error {
  color: var(--status-danger);
}
</style>
