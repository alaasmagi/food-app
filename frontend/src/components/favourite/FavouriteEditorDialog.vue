<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from '../design-system/feedback/Dialog.vue'
import Input from '../design-system/forms/Input.vue'
import Button from '../design-system/forms/Button.vue'
import RatingStars from './RatingStars.vue'
import { useFavouritesStore } from '../../stores/favourites'
import { useToastsStore } from '../../stores/toasts'

const props = defineProps<{ open: boolean; restaurantId: string }>()
const emit = defineEmits<{ close: [] }>()

const favourites = useFavouritesStore()
const toasts = useToastsStore()

const rating = ref(0)
const note = ref('')
const saving = ref(false)

// Seed the form from the existing favourite each time the dialog opens.
watch(
  () => props.open,
  (open) => {
    if (!open) return
    const existing = favourites.favouriteFor(props.restaurantId)
    rating.value = existing?.rating ?? 0
    note.value = existing?.note ?? ''
  },
)

// Mirror the backend [Range(1,5)] validation before calling the API.
const valid = computed(
  () => Number.isInteger(rating.value) && rating.value >= 1 && rating.value <= 5,
)

async function save(): Promise<void> {
  if (!valid.value || saving.value) return
  saving.value = true
  try {
    await favourites.upsert(props.restaurantId, rating.value, note.value.trim() || null)
    toasts.push({ title: 'Rating saved', tone: 'success' })
    emit('close')
  } catch {
    toasts.push({
      title: 'Could not save rating',
      description: 'Please try again.',
      tone: 'danger',
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog :open="open" title="Rate restaurant" @close="emit('close')">
    <div class="fav-editor">
      <div class="fav-editor__field">
        <span class="fav-editor__label">Rating</span>
        <RatingStars v-model="rating" editable :size="24" />
      </div>
      <Input v-model="note" label="Note" placeholder="Optional" multiline :rows="3" />
    </div>

    <template #footer>
      <Button variant="ghost" @click="emit('close')">Cancel</Button>
      <Button variant="primary" :disabled="!valid" :loading="saving" @click="save">Save</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.fav-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.fav-editor__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.fav-editor__label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}
</style>
