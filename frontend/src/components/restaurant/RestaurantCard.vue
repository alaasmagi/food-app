<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Card from '../design-system/data-display/Card.vue'
import Badge from '../design-system/data-display/Badge.vue'
import Tag from '../design-system/data-display/Tag.vue'
import Button from '../design-system/forms/Button.vue'
import Icon from '../design-system/Icon.vue'
import OfferList from './OfferList.vue'
import RatingStars from '../favourite/RatingStars.vue'
import FavouriteEditorDialog from '../favourite/FavouriteEditorDialog.vue'
import { useRestaurantsStore } from '../../stores/restaurants'
import { useEnvironmentsStore } from '../../stores/environments'
import { useFavouritesStore } from '../../stores/favourites'
import { hasCoordinates } from './mapMarkers'
import type { Restaurant } from '../../types/restaurant'

// Figma "Restaurant card": today's offers first, quiet details below, actions as icon buttons.
const props = defineProps<{ restaurant: Restaurant; distance?: string | null }>()
// The card has no map access; the dashboard listens for this and focuses the restaurant on the map.
const emit = defineEmits<{ showOnMap: [restaurant: Restaurant] }>()
const store = useRestaurantsStore()
const environments = useEnvironmentsStore()
const favourites = useFavouritesStore()

// How many offers the card shows before "+N more".
const PREVIEW = 2

// "Show on map" only makes sense for a located restaurant (0/0 sentinel excluded).
const locatable = computed(() => hasCoordinates(props.restaurant))

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
const offers = computed(() => entry.value?.offers ?? [])
const hiddenCount = computed(() => Math.max(0, offers.value.length - PREVIEW))
const details = computed(() =>
  [props.restaurant.parkingInfo, props.restaurant.openingInfo && `Open ${props.restaurant.openingInfo}`]
    .filter(Boolean)
    .join(' · '),
)

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

// Offers are the point of the card, so they load on their own once the card scrolls into view —
// only for restaurants that report offers today, and only once (the store caches per id).
const root = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
onMounted(() => {
  if (!props.restaurant.hasOffers || typeof IntersectionObserver === 'undefined' || !root.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        store.loadOffers(props.restaurant.id)
        observer?.disconnect()
      }
    },
    { rootMargin: '200px' },
  )
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="root">
    <Card class="restaurant">
      <div class="restaurant__head">
        <div class="restaurant__titles">
          <h2 class="restaurant__name">{{ restaurant.name }}</h2>
          <Tag>{{ restaurant.city }}</Tag>
          <Badge v-if="restaurant.isFastFood" tone="accent">Fast food</Badge>
        </div>
        <div class="restaurant__side">
          <RatingStars v-if="favourite" class="restaurant__rating" :model-value="favourite.rating" />
          <span v-if="distance" class="restaurant__distance">{{ distance }}</span>
          <div class="restaurant__tools">
            <Button
              v-if="showMembership"
              variant="ghost"
              icon="bookmark"
              icon-only
              class="restaurant__member"
              :class="{ 'restaurant__member--on': isMember }"
              :aria-pressed="isMember"
              :loading="membershipPending"
              @click="toggleMembership"
            >
              {{ isMember ? 'Remove from place' : 'Add to place' }}
            </Button>
            <Button variant="ghost" icon="star" icon-only @click="editorOpen = true">
              {{ favourite ? 'Edit rating' : 'Rate' }}
            </Button>
            <Button
              v-if="locatable"
              variant="ghost"
              icon="map-pin"
              icon-only
              @click="emit('showOnMap', restaurant)"
            >
              Show on map
            </Button>
          </div>
        </div>
      </div>

      <div v-if="noOffers" class="restaurant__no-offers">
        <Icon name="info" :size="16" />
        No lunch offers today
      </div>
      <div v-else class="restaurant__today">
        <div class="restaurant__today-head">
          <span class="restaurant__kicker">Today</span>
          <span v-if="restaurant.offerTimeText" class="restaurant__time">{{ restaurant.offerTimeText }}</span>
        </div>
        <OfferList v-if="entry && (entry.loaded || entry.error)" :restaurant-id="restaurant.id" :limit="expanded ? undefined : PREVIEW" />
        <Button
          v-if="!entry || (!entry.loaded && !entry.error)"
          variant="ghost"
          class="restaurant__more"
          :loading="entry?.loading"
          @click="toggleOffers"
        >
          See offers
        </Button>
        <button v-else-if="hiddenCount > 0" type="button" class="restaurant__more-link" @click="expanded = !expanded">
          {{ expanded ? 'Show fewer offers' : `+${hiddenCount} more offer${hiddenCount > 1 ? 's' : ''}` }}
        </button>
      </div>

      <p v-if="details" class="restaurant__details">{{ details }}</p>

      <FavouriteEditorDialog
        :open="editorOpen"
        :restaurant-id="restaurant.id"
        @close="editorOpen = false"
      />
    </Card>
  </div>
</template>

<style scoped>
.restaurant { padding: var(--space-6); }
.restaurant__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); }
.restaurant__titles { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); min-width: 0; }
.restaurant__name { margin: 0; font-family: var(--font-display); font-size: 18px; line-height: 24px; font-weight: var(--weight-semibold); letter-spacing: -0.005em; color: var(--color-text-primary); }
.restaurant__side { display: flex; align-items: center; gap: var(--space-3); margin-left: auto; }
.restaurant__distance { font-size: 14px; line-height: 20px; color: var(--color-text-muted); white-space: nowrap; }
.restaurant__tools { display: flex; align-items: center; }
.restaurant__member--on :deep(svg) { color: var(--color-accent-solid); fill: var(--color-accent-solid); }
.restaurant__today { display: flex; flex-direction: column; gap: var(--space-1); }
.restaurant__today-head { display: flex; align-items: center; gap: var(--space-2); }
.restaurant__kicker { font-size: 12px; line-height: 16px; font-weight: var(--weight-medium); letter-spacing: 0.005em; text-transform: uppercase; color: var(--color-accent-text); }
.restaurant__time { font-size: 12px; line-height: 16px; font-weight: var(--weight-medium); color: var(--color-text-muted); }
.restaurant__more { align-self: flex-start; margin-left: calc(-1 * var(--space-5)); }
.restaurant__more-link { align-self: flex-start; padding: var(--space-1) 0; border: 0; background: none; color: var(--color-accent-text); font-family: var(--font-body); font-size: 14px; line-height: 20px; font-weight: var(--weight-semibold); cursor: pointer; }
.restaurant__more-link:hover { text-decoration: underline; text-underline-offset: 3px; }
.restaurant__no-offers { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--color-bg-sunken); color: var(--color-text-secondary); font-size: 14px; line-height: 20px; }
.restaurant__no-offers :deep(svg) { color: var(--color-text-muted); }
.restaurant__details { margin: 0; font-size: 12px; line-height: 16px; color: var(--color-text-muted); }
@media (max-width: 599px) {
  .restaurant { padding: var(--space-4); }
  .restaurant__side { margin-left: 0; width: 100%; justify-content: space-between; }
}
</style>
