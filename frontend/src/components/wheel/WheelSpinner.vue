<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from '../design-system/forms/Button.vue'

const props = defineProps<{ names: string[] }>()
const emit = defineEmits<{ result: [name: string] }>()

// Token-only segment palette (no hardcoded colors), cycled by index.
const PALETTE = [
  'var(--accent-7)',
  'var(--status-success)',
  'var(--status-warning)',
  'var(--status-danger)',
  'var(--accent-5)',
  'var(--neutral-5)',
]

const CENTER = 100
const RADIUS = 92
const LABEL_RADIUS = 60

const rotation = ref(0)
const spinning = ref(false)
const result = ref<string | null>(null)
let chosenIndex = 0

const canSpin = computed(() => props.names.length >= 2 && !spinning.value)

function pointAt(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180
  // Angle measured clockwise from the top (12 o'clock).
  return [CENTER + radius * Math.sin(rad), CENTER - radius * Math.cos(rad)]
}

const segments = computed(() => {
  const n = props.names.length
  const seg = 360 / n
  return props.names.map((name, i) => {
    const a1 = i * seg
    const a2 = (i + 1) * seg
    const [x1, y1] = pointAt(a1, RADIUS)
    const [x2, y2] = pointAt(a2, RADIUS)
    const largeArc = seg > 180 ? 1 : 0
    const path = `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`
    const [lx, ly] = pointAt(a1 + seg / 2, LABEL_RADIUS)
    return {
      name,
      path,
      color: PALETTE[i % PALETTE.length],
      label: name.length > 12 ? `${name.slice(0, 11)}…` : name,
      lx,
      ly,
    }
  })
})

function spin(): void {
  if (!canSpin.value) return
  const n = props.names.length
  chosenIndex = Math.floor(Math.random() * n)
  const seg = 360 / n
  const center = (chosenIndex + 0.5) * seg
  // Land the chosen segment's centre under the top pointer: rotation ≡ -center (mod 360).
  const currentMod = ((rotation.value % 360) + 360) % 360
  const desiredMod = (((-center) % 360) + 360) % 360
  let delta = desiredMod - currentMod
  if (delta < 0) delta += 360
  rotation.value = rotation.value + delta + 360 * 5
  spinning.value = true
}

function onTransitionEnd(): void {
  if (!spinning.value) return
  spinning.value = false
  result.value = props.names[chosenIndex]
  emit('result', props.names[chosenIndex])
}
</script>

<template>
  <div class="spinner">
    <div class="spinner__wheel-wrap">
      <span class="spinner__pointer" aria-hidden="true" />
      <svg class="spinner__wheel" viewBox="0 0 200 200" role="img" aria-label="Restaurant wheel">
        <g
          class="spinner__rotor"
          :style="{ transform: `rotate(${rotation}deg)` }"
          @transitionend="onTransitionEnd"
        >
          <template v-for="seg in segments" :key="seg.name">
            <path :d="seg.path" :fill="seg.color" stroke="var(--surface-app)" stroke-width="1" />
            <text
              :x="seg.lx"
              :y="seg.ly"
              class="spinner__label"
              text-anchor="middle"
              dominant-baseline="middle"
            >
              {{ seg.label }}
            </text>
          </template>
        </g>
        <circle :cx="CENTER" :cy="CENTER" r="6" fill="var(--surface-raised)" stroke="var(--border-strong)" />
      </svg>
    </div>

    <div class="spinner__controls">
      <Button variant="primary" :disabled="!canSpin" :loading="spinning" @click="spin">Spin</Button>
      <p v-if="result" class="spinner__result">Winner: {{ result }}</p>
      <p v-else-if="names.length < 2" class="spinner__hint">Add at least 2 restaurants to spin.</p>
    </div>
  </div>
</template>

<style scoped>
.spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
}

.spinner__wheel-wrap {
  position: relative;
  width: 280px;
  max-width: 100%;
}

.spinner__wheel {
  display: block;
  width: 100%;
  height: auto;
}

.spinner__rotor {
  transform-origin: 100px 100px;
  transition: transform 3.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.spinner__label {
  font-family: var(--font-body);
  font-size: 7px;
  font-weight: var(--weight-semibold);
  fill: var(--text-on-accent);
}

.spinner__pointer {
  position: absolute;
  top: -2px;
  left: 50%;
  z-index: 1;
  width: 0;
  height: 0;
  transform: translateX(-50%);
  border-right: 8px solid transparent;
  border-left: 8px solid transparent;
  border-top: 14px solid var(--text-primary);
}

.spinner__controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.spinner__result {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.spinner__hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
</style>
