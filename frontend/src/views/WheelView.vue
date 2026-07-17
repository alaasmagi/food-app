<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import Card from '../components/design-system/data-display/Card.vue'
import Button from '../components/design-system/forms/Button.vue'
import WheelSpinner from '../components/wheel/WheelSpinner.vue'
import WheelEditorDialog from '../components/wheel/WheelEditorDialog.vue'
import { useWheelsStore } from '../stores/wheels'
import { useRestaurantsStore } from '../stores/restaurants'
import { useToastsStore } from '../stores/toasts'
import { useShareWheelLink } from '../composables/useShareWheelLink'
import type { UserWheel } from '../types/wheel'

const wheels = useWheelsStore()
const restaurants = useRestaurantsStore()
const toasts = useToastsStore()
const { copyShareLink } = useShareWheelLink()
const { list } = storeToRefs(wheels)

const selectedId = ref<string | null>(null)
const editorOpen = ref(false)
const editing = ref<UserWheel | null>(null)
const confirmingDeleteId = ref<string | null>(null)

onMounted(() => {
  wheels.loadWheels()
  // The editor's checkbox list is built from the already-loaded catalog.
  restaurants.loadRestaurants()
})

const selected = computed(() => list.value.find((wheel) => wheel.id === selectedId.value) ?? null)

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
  toasts.push({ title: 'Winner', description: name, tone: 'success' })
}
</script>

<template>
  <section class="wheels">
    <div class="wheels__header">
      <h1 class="wheels__title">Wheels</h1>
      <Button variant="primary" size="sm" icon="plus" @click="openNew">New wheel</Button>
    </div>

    <p v-if="!list.length" class="wheels__status">You have no wheels yet.</p>

    <div v-else class="wheels__grid">
      <div class="wheels__list">
        <Card v-for="wheel in list" :key="wheel.id">
          <div class="wheels__card-head">
            <h2 class="wheels__card-name">{{ wheel.name }}</h2>
            <span class="wheels__card-count">{{ wheel.restaurantNames.length }} restaurants</span>
          </div>
          <div class="wheels__card-actions">
            <Button variant="secondary" size="sm" @click="selectForSpin(wheel)">Spin</Button>
            <Button variant="ghost" size="sm" @click="openEdit(wheel)">Edit</Button>
            <Button
              v-if="wheel.isPublic"
              variant="ghost"
              size="sm"
              icon="link"
              aria-label="Copy share link"
              @click="copyShareLink(wheel.id)"
            />
            <template v-if="confirmingDeleteId === wheel.id">
              <Button variant="danger" size="sm" @click="remove(wheel)">Confirm delete</Button>
              <Button variant="ghost" size="sm" @click="confirmingDeleteId = null">Cancel</Button>
            </template>
            <Button v-else variant="ghost" size="sm" @click="confirmingDeleteId = wheel.id">
              Delete
            </Button>
          </div>
        </Card>
      </div>

      <div v-if="selected" class="wheels__spinner">
        <WheelSpinner :names="selected.restaurantNames" @result="onResult" />
      </div>
    </div>

    <WheelEditorDialog :open="editorOpen" :wheel="editing" @close="closeEditor" />
  </section>
</template>

<style scoped>
.wheels {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}

.wheels__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.wheels__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

.wheels__status {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.wheels__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 720px) {
  .wheels__grid {
    grid-template-columns: 1fr 320px;
    align-items: start;
  }
}

.wheels__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.wheels__card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.wheels__card-name {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.wheels__card-count {
  flex-shrink: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.wheels__card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.wheels__spinner {
  padding: var(--space-6);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}
</style>
