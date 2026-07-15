<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import Dialog from '../design-system/feedback/Dialog.vue'
import Input from '../design-system/forms/Input.vue'
import Button from '../design-system/forms/Button.vue'
import { useEnvironmentsStore } from '../../stores/environments'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const store = useEnvironmentsStore()

const newName = ref('')
const newDescription = ref('')
const drafts = reactive<Record<string, string>>({})
const confirmingDeleteId = ref<string | null>(null)
const error = ref<string | null>(null)

// Keep a rename draft per environment, seeded from the store.
watch(
  () => store.list,
  (list) => {
    for (const environment of list) {
      if (!(environment.id in drafts)) drafts[environment.id] = environment.name
    }
  },
  { immediate: true, deep: true },
)

function fail(): void {
  error.value = 'The action could not be completed. Please try again.'
}

function descriptionOf(id: string): string | null {
  return store.list.find((environment) => environment.id === id)?.description ?? null
}

async function create(): Promise<void> {
  const name = newName.value.trim()
  if (!name) return
  error.value = null
  try {
    await store.createEnvironment({
      name,
      description: newDescription.value.trim() || null,
    })
    newName.value = ''
    newDescription.value = ''
  } catch {
    fail()
  }
}

async function rename(id: string): Promise<void> {
  const name = drafts[id]?.trim()
  if (!name) return
  error.value = null
  try {
    await store.renameEnvironment(id, { name, description: descriptionOf(id) })
  } catch {
    fail()
  }
}

async function confirmDelete(id: string): Promise<void> {
  error.value = null
  try {
    await store.deleteEnvironment(id)
    confirmingDeleteId.value = null
  } catch {
    fail()
  }
}

function close(): void {
  confirmingDeleteId.value = null
  error.value = null
  emit('close')
}
</script>

<template>
  <Dialog :open="open" title="Manage environments" width="480px" @close="close">
    <div class="editor">
      <p v-if="error" class="editor__error">{{ error }}</p>

      <ul v-if="store.list.length" class="editor__list">
        <li v-for="environment in store.list" :key="environment.id" class="editor__row">
          <Input v-model="drafts[environment.id]" size="sm" />
          <div class="editor__row-actions">
            <template v-if="confirmingDeleteId === environment.id">
              <span class="editor__confirm">Delete this environment?</span>
              <Button variant="danger" size="sm" @click="confirmDelete(environment.id)">
                Confirm delete
              </Button>
              <Button variant="ghost" size="sm" @click="confirmingDeleteId = null">Cancel</Button>
            </template>
            <template v-else>
              <Button variant="secondary" size="sm" @click="rename(environment.id)">Rename</Button>
              <Button variant="ghost" size="sm" @click="confirmingDeleteId = environment.id">
                Delete
              </Button>
            </template>
          </div>
        </li>
      </ul>
      <p v-else class="editor__empty">You have no environments yet.</p>

      <div class="editor__create">
        <Input v-model="newName" label="New environment" placeholder="Work" size="sm" />
        <Input
          v-model="newDescription"
          label="Description"
          placeholder="Optional"
          size="sm"
          multiline
          :rows="2"
        />
        <Button variant="primary" size="sm" icon="plus" :disabled="!newName.trim()" @click="create">
          Create
        </Button>
      </div>
    </div>

    <template #footer>
      <Button variant="ghost" @click="close">Close</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.editor__error {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--status-danger);
}

.editor__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.editor__row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.editor__row-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.editor__confirm {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.editor__empty {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.editor__create {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-subtle);
}
</style>
