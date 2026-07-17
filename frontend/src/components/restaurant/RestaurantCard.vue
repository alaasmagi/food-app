<script setup lang="ts">
import { computed, ref } from 'vue'
import Card from '../design-system/data-display/Card.vue'
import Badge from '../design-system/data-display/Badge.vue'
import Tag from '../design-system/data-display/Tag.vue'
import Button from '../design-system/forms/Button.vue'
import OfferList from './OfferList.vue'
import RatingStars from '../favourite/RatingStars.vue'
import FavouriteEditorDialog from '../favourite/FavouriteEditorDialog.vue'
import { useRestaurantsStore } from '../../stores/restaurants'
import { useEnvironmentsStore } from '../../stores/environments'
import { useFavouritesStore } from '../../stores/favourites'
import type { Restaurant } from '../../types/restaurant'

const props = defineProps<{ restaurant: Restaurant }>()
const store = useRestaurantsStore()
const environments = useEnvironmentsStore()
const favourites = useFavouritesStore()

// Expansion is local view state; the store owns only fetched data.
const expanded = ref(false)
const editorOpen = ref(false)

const favourite = computed(() => favourites.favouriteFor(props.restaurant.id))

const entry = computed(() => store.offersFor(props.restaurant.id))
const noOffers = computed(() => {
  if (!props.restaurant.hasOffers) return true
  const e = entry.value
  return Boolean(e && e.loaded && e.offers.length === 0)
})

// The membership action only appears when a specific environment (not "All") is selected.
const showMembership = computed(() => environments.selectedEnvironmentId !== null)
const isMember = computed(() => environments.isMember(props.restaurant.id))
const membershipPending = computed(() => environments.isPending(props.restaurant.id))

async function toggleOffers(): Promise<void> {
  expanded.value = !expanded.value
  if (expanded.value) {
    await store.loadOffers(props.restaurant.id)
  }
}

async function toggleMembership(): Promise<void> {
  if (isMember.value) {
    await environments.removeRestaurant(props.restaurant.id)
  } else {
    await environments.addRestaurant(props.restaurant.id)
  }
}
</script>

<template>
  <Card>
    <div class="restaurant__head">
      <div class="restaurant__titles">
        <h2 class="restaurant__name">{{ restaurant.name }}</h2>
        <Tag>{{ restaurant.city }}</Tag>
      </div>
      <div class="restaurant__badges">
        <Badge v-if="restaurant.isFastFood" tone="accent">Fast food</Badge>
        <Badge v-if="noOffers" tone="neutral">No offers today</Badge>
      </div>
    </div>

    <RatingStars v-if="favourite" class="restaurant__rating" :model-value="favourite.rating" />

    <dl class="restaurant__meta">
      <div class="restaurant__row">
        <dt>Offer time</dt>
        <dd>{{ restaurant.offerTimeText }}</dd>
      </div>
      <div class="restaurant__row">
        <dt>Parking</dt>
        <dd>{{ restaurant.parkingInfo }}</dd>
      </div>
      <div class="restaurant__row">
        <dt>Opening</dt>
        <dd>{{ restaurant.openingInfo }}</dd>
      </div>
    </dl>

    <div class="restaurant__actions">
      <Button
        variant="secondary"
        size="sm"
        :icon="expanded ? 'chevron-up' : 'chevron-down'"
        iconPosition="right"
        @click="toggleOffers"
      >
        {{ expanded ? 'Hide offers' : 'See offers' }}
      </Button>

      <Button
        v-if="showMembership"
        :variant="isMember ? 'ghost' : 'secondary'"
        size="sm"
        :icon="isMember ? 'minus' : 'plus'"
        :loading="membershipPending"
        @click="toggleMembership"
      >
        {{ isMember ? 'Remove from environment' : 'Add to environment' }}
      </Button>

      <Button variant="ghost" size="sm" @click="editorOpen = true">
        {{ favourite ? 'Edit rating' : 'Rate' }}
      </Button>
    </div>

    <OfferList v-if="expanded" :restaurant-id="restaurant.id" />

    <FavouriteEditorDialog
      :open="editorOpen"
      :restaurant-id="restaurant.id"
      @close="editorOpen = false"
    />
  </Card>
</template>

<style scoped>
.restaurant__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.restaurant__titles {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.restaurant__name {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

.restaurant__badges {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.restaurant__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0 0 var(--space-5);
}

.restaurant__rating {
  margin-bottom: var(--space-4);
}

.restaurant__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.restaurant__row {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-sm);
}

.restaurant__row dt {
  flex-shrink: 0;
  width: 88px;
  color: var(--text-secondary);
}

.restaurant__row dd {
  margin: 0;
  color: var(--text-primary);
}
</style>
