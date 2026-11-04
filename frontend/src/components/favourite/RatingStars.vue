<script setup lang="ts">
// Feature-specific rating control.
withDefaults(
  defineProps<{
    editable?: boolean
    size?: number
  }>(),
  {
    editable: false,
    size: 20,
  },
)

const model = defineModel<number>({ default: 0 })

const STARS = [1, 2, 3, 4, 5]
const STAR_PATH =
  'M12 2l2.9 6.26 6.9.53-5.2 4.52 1.6 6.79L12 17.27 5.8 20.6l1.6-6.79L2.2 8.79l6.9-.53L12 2z'

function select(value: number): void {
  model.value = value
}
</script>

<template>
  <div class="stars" :class="{ 'stars--editable': editable }">
    <component
      :is="editable ? 'button' : 'span'"
      v-for="n in STARS"
      :key="n"
      class="stars__star"
      :class="{ 'stars__star--filled': n <= model }"
      :type="editable ? 'button' : undefined"
      :aria-label="editable ? `Rate ${n}` : undefined"
      @click="editable && select(n)"
    >
      <svg
        class="stars__glyph"
        :style="{ width: `${size}px`, height: `${size}px` }"
        viewBox="0 0 24 24"
        stroke-linejoin="round"
      >
        <path :d="STAR_PATH" />
      </svg>
    </component>
  </div>
</template>

<style scoped>
.stars {
  display: inline-flex;
  gap: var(--space-0-5);
}

.stars__star {
  display: inline-flex;
  padding: 0;
  color: var(--border-strong);
  background: none;
  border: none;
}

.stars--editable .stars__star {
  cursor: pointer;
}

.stars__star--filled {
  color: var(--color-accent-solid);
}

.stars__glyph {
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.stars__star--filled .stars__glyph {
  fill: currentColor;
}
</style>
