<script setup lang="ts">
import { computed, watch } from 'vue'
import Badge from '../design-system/data-display/Badge.vue'
import Button from '../design-system/forms/Button.vue'
import Checkbox from '../design-system/forms/Checkbox.vue'
import OfferList from '../restaurant/OfferList.vue'
import RatingStars from '../favourite/RatingStars.vue'
import { useRestaurantsStore } from '../../stores/restaurants'
import { useFavouritesStore } from '../../stores/favourites'
import { hasCoordinates } from '../restaurant/mapMarkers'

// Figma "Winner" panel: what to do once the wheel stops — today's offers, map, spin again.
// `withDetails` is off on the public shared wheel (no signed-in data there).
const props = withDefaults(
  defineProps<{ name: string; withDetails?: boolean; canSpin?: boolean; leaveOut?: boolean }>(),
  { withDetails: true, canSpin: true, leaveOut: false },
)
const emit = defineEmits<{ spinAgain: []; showOnMap: [name: string]; 'update:leaveOut': [value: boolean] }>()

const restaurants = useRestaurantsStore()
const favourites = useFavouritesStore()

// Wheels store names (a frozen snapshot), so the restaurant is looked up by name in the catalog.
const restaurant = computed(() =>
  props.withDetails ? (restaurants.list.find((r) => r.name === props.name) ?? null) : null,
)
const rating = computed(() => (restaurant.value ? favourites.favouriteFor(restaurant.value.id)?.rating : undefined))

watch(
  () => [props.name, props.withDetails] as const,
  async () => {
    if (!props.withDetails) return
    await restaurants.loadRestaurants()
    if (restaurant.value?.hasOffers) restaurants.loadOffers(restaurant.value.id)
  },
  { immediate: true },
)

const leaveOutModel = computed({
  get: () => props.leaveOut,
  set: (value: boolean) => emit('update:leaveOut', value),
})
</script>

<template>
  <div class="winner" role="status" aria-live="polite">
    <div class="winner__head">
      <Badge tone="accent">Winner</Badge>
      <RatingStars v-if="rating" :model-value="rating" />
    </div>
    <h3 class="winner__name">{{ name }}</h3>
    <template v-if="restaurant">
      <div v-if="restaurant.hasOffers" class="winner__today">
        <div class="winner__today-head">
          <span class="winner__kicker">Today</span>
          <span v-if="restaurant.offerTimeText" class="winner__time">{{ restaurant.offerTimeText }}</span>
        </div>
        <OfferList :restaurant-id="restaurant.id" :limit="2" />
      </div>
      <p v-else class="winner__none">No lunch offers today</p>
      <Button
        v-if="hasCoordinates(restaurant)"
        variant="secondary"
        icon="map-pin"
        full-width
        @click="emit('showOnMap', name)"
      >
        Show on map
      </Button>
    </template>
    <Button variant="primary" icon="refresh" full-width :disabled="!canSpin" @click="emit('spinAgain')">
      Spin again
    </Button>
    <Checkbox v-if="withDetails" v-model="leaveOutModel" :label="`Leave out ${name}`" />
  </div>
</template>

<style scoped>
.winner { display: flex; flex-direction: column; gap: var(--space-3); width: 100%; box-sizing: border-box; padding: var(--space-5); background: var(--color-bg-surface); border: var(--border-thin) solid var(--color-accent-border); border-radius: var(--radius-lg); }
.winner__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
.winner__name { margin: 0; font-size: 22px; line-height: 28px; font-weight: var(--weight-semibold); letter-spacing: -0.005em; color: var(--color-text-primary); }
.winner__today { display: flex; flex-direction: column; gap: var(--space-1); }
.winner__today-head { display: flex; gap: var(--space-2); }
.winner__kicker { font-size: 12px; line-height: 16px; font-weight: var(--weight-medium); text-transform: uppercase; color: var(--color-accent-text); }
.winner__time { font-size: 12px; line-height: 16px; font-weight: var(--weight-medium); color: var(--color-text-muted); }
.winner__today :deep(.offers__item) { font-size: 14px; line-height: 20px; padding: var(--space-1-5) 0; }
.winner__none { margin: 0; font-size: 14px; line-height: 20px; color: var(--color-text-secondary); }
</style>
