<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Card from '../components/design-system/data-display/Card.vue'
import Button from '../components/design-system/forms/Button.vue'
import WheelSpinner from '../components/wheel/WheelSpinner.vue'
import WheelEditorDialog from '../components/wheel/WheelEditorDialog.vue'
import WinnerPanel from '../components/wheel/WinnerPanel.vue'
import { useEnvironmentsStore } from '../stores/environments'
import { useRestaurantsStore } from '../stores/restaurants'
import { useWheelsStore } from '../stores/wheels'
import { useToastsStore } from '../stores/toasts'
import { useShareWheelLink } from '../composables/useShareWheelLink'
import type { UserWheel } from '../types/wheel'

const wheels = useWheelsStore()
const toasts = useToastsStore()
const { copyShareLink } = useShareWheelLink()
const { list } = storeToRefs(wheels)

const selectedId = ref<string | null>(null)
const editorOpen = ref(false)
const editing = ref<UserWheel | null>(null)
const confirmingDeleteId = ref<string | null>(null)

onMounted(() => {
  wheels.loadWheels()
  // The editor's restaurant picker fetches its own paged/searchable list, so there's no catalog to
  // preload here.
})

// Router is optional (the view can be mounted on its own in tests).
const route = useRoute() as ReturnType<typeof useRoute> | undefined
const router = useRouter() as ReturnType<typeof useRouter> | undefined
const environments = useEnvironmentsStore()
const restaurants = useRestaurantsStore()

// "Spin <place>" (from the dashboard or the Places page) arrives as ?place=<id>: the place's
// restaurants become a temporary, unsaved wheel.
const placeId = computed(() => {
  const value = route?.query?.place
  return typeof value === 'string' && value ? value : null
})
watch(
  placeId,
  async (id) => {
    if (!id) return
    selectedId.value = null
    await Promise.all([environments.loadEnvironments(), environments.loadMembership(), restaurants.loadRestaurants()])
  },
  { immediate: true },
)
const placeWheel = computed(() => {
  if (!placeId.value) return null
  const env = environments.list.find((e) => e.id === placeId.value)
  if (!env) return null
  const members = environments.membershipByEnv[env.id] ?? {}
  const names = restaurants.list.filter((r) => members[r.id]).map((r) => r.name)
  return { id: `place:${env.id}`, name: env.name, restaurantNames: names }
})

const selected = computed(
  () => placeWheel.value ?? list.value.find((wheel) => wheel.id === selectedId.value) ?? null,
)

// Winner panel state. "Leave out" drops the last winner from the next spin (not from the wheel).
const spinner = ref<InstanceType<typeof WheelSpinner> | null>(null)
const winner = ref<string | null>(null)
const leaveOut = ref(true)
const excluded = ref<string | null>(null)
const spinNames = computed(() => {
  const names = selected.value?.restaurantNames ?? []
  return excluded.value ? names.filter((n) => n !== excluded.value) : names
})
watch(
  () => selected.value?.id,
  () => {
    winner.value = null
    excluded.value = null
  },
)
function spinAgain(): void {
  excluded.value = leaveOut.value ? winner.value : null
  winner.value = null
  // Let the wheel re-render without the excluded segment before it spins.
  requestAnimationFrame(() => spinner.value?.spin())
}
function showOnMap(name: string): void {
  router?.push({ path: '/', query: { focus: name } })
}

function openNew(): void {
  editing.value = null
  editorOpen.value = true
}

function openEdit(wheel: UserWheel): void {
  editing.value = wheel
  editorOpen.value = true
}

function closeEditor(): void {
  editorOpen.value = false
  editing.value = null
}

function selectForSpin(wheel: UserWheel): void {
  if (placeId.value) router?.replace({ path: '/wheel' })
  selectedId.value = wheel.id
}

async function remove(wheel: UserWheel): Promise<void> {
  try {
    await wheels.deleteWheel(wheel.id)
    if (selectedId.value === wheel.id) selectedId.value = null
    confirmingDeleteId.value = null
  } catch {
    toasts.push({ title: 'Could not delete wheel', description: 'Please try again.', tone: 'danger' })
  }
}

function onResult(name: string): void {
  winner.value = name
}
</script>

<template>
  <section class="wheels">
    <div class="wheels__header">
      <h1 class="wheels__title">Wheels</h1>
      <Button variant="primary" icon="plus" @click="openNew">New wheel</Button>
    </div>
    <p v-if="!list.length && !placeWheel" class="wheels__status">You have no wheels yet.</p>
    <div v-else class="wheels__grid">
      <div class="wheels__list">
        <p v-if="list.length" class="wheels__hint">Select a wheel to spin it.</p>
        <Card
          v-for="wheel in list"
          :key="wheel.id"
          hoverable
          padding="16px 20px"
          class="wheels__card"
          :class="{ 'wheels__card--active': selectedId === wheel.id }"
          role="button"
          tabindex="0"
          :aria-pressed="selectedId === wheel.id"
          @click="selectForSpin(wheel)"
          @keydown.enter="selectForSpin(wheel)"
        >
          <div class="wheels__card-head">
            <div class="wheels__card-titles">
              <h2 class="wheels__card-name">{{ wheel.name }}</h2>
              <span class="wheels__card-count">{{ wheel.restaurantNames.length }} restaurants</span>
            </div>
            <div class="wheels__card-actions" @click.stop @keydown.enter.stop>
              <template v-if="confirmingDeleteId === wheel.id">
                <span class="wheels__confirm">Delete this wheel?</span>
                <Button variant="danger" @click="remove(wheel)">Confirm delete</Button>
                <Button variant="ghost" @click="confirmingDeleteId = null">Cancel</Button>
              </template>
              <template v-else>
                <Button
                  v-if="wheel.isPublic"
                  variant="ghost"
                  icon="link"
                  icon-only
                  aria-label="Copy share link"
                  @click="copyShareLink(wheel.id)"
                >
                  Copy share link
                </Button>
                <Button variant="ghost" icon="pencil" icon-only :aria-label="`Edit ${wheel.name}`" @click="openEdit(wheel)">Edit</Button>
                <Button
                  variant="ghost"
                  icon="trash"
                  icon-only
                  class="wheels__delete"
                  :aria-label="`Delete ${wheel.name}`"
                  @click="confirmingDeleteId = wheel.id"
                >
                  Delete
                </Button>
              </template>
            </div>
          </div>
        </Card>
      </div>
      <div v-if="selected" class="wheels__spinner">
        <h2 class="wheels__spinner-title">{{ selected.name }}</h2>
        <WheelSpinner
          ref="spinner"
          :names="spinNames"
          hide-result
          :hide-controls="!!winner"
          @result="onResult"
        />
        <WinnerPanel
          v-if="winner"
          v-model:leave-out="leaveOut"
          :name="winner"
          :can-spin="selected.restaurantNames.length - (leaveOut ? 1 : 0) >= 2"
          @spin-again="spinAgain"
          @show-on-map="showOnMap"
        />
      </div>
    </div>
    <WheelEditorDialog :open="editorOpen" :wheel="editing" @close="closeEditor" />
  </section>
</template>

<style scoped>
/* Figma "Desktop / 08 Wheels": list of wheels (click to select) next to the spinner + winner panel. */
.wheels { display: flex; flex-direction: column; gap: var(--space-6); max-width: 1120px; }
.wheels__header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4); }
.wheels__title { margin: 0; font-size: 36px; line-height: 44px; font-weight: var(--weight-bold); letter-spacing: -0.015em; color: var(--color-text-primary); }
.wheels__status, .wheels__hint { margin: 0; font-size: 14px; line-height: 20px; color: var(--color-text-muted); }
.wheels__status { font-size: 16px; line-height: 24px; color: var(--color-text-secondary); }
.wheels__grid { display: grid; grid-template-columns: 1fr; gap: var(--space-6); }
@media (min-width: 900px) {
  .wheels__grid { grid-template-columns: minmax(0, 1fr) 360px; align-items: start; }
  /* Keep the spinner in view while scrolling a long list of wheels. */
  .wheels__spinner { position: sticky; top: var(--space-6); }
}
.wheels__list { display: flex; flex-direction: column; gap: var(--space-3); }
.wheels__card { gap: 0; }
.wheels__card:focus-visible { outline: var(--border-thick) solid var(--color-focus-ring); outline-offset: 2px; }
.wheels__card--active { border: var(--border-thick) solid var(--color-accent-solid); background: var(--color-accent-subtle); }
.wheels__card-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.wheels__card-titles { display: flex; flex-direction: column; gap: var(--space-0-5); flex: 1; min-width: 0; }
.wheels__card-name { margin: 0; font-size: 18px; line-height: 24px; font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.wheels__card-count { font-size: 14px; line-height: 20px; color: var(--color-text-muted); }
.wheels__card-actions { display: flex; align-items: center; gap: var(--space-1); }
.wheels__confirm { font-size: 14px; line-height: 20px; color: var(--color-text-secondary); }
.wheels__delete { color: var(--color-status-danger-text); }
.wheels__spinner { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
.wheels__spinner-title { margin: 0; align-self: stretch; font-size: 18px; line-height: 24px; font-weight: var(--weight-semibold); color: var(--color-text-primary); }
</style>
