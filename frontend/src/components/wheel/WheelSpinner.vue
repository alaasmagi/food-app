<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from '../design-system/forms/Button.vue'

const props = defineProps<{
  names: string[]
  /** Hide the built-in winner line (the page shows its own winner panel). */
  hideResult?: boolean
  /** Hide the built-in Spin button (the page drives `spin()` itself). */
  hideControls?: boolean
}>()
const emit = defineEmits<{ result: [name: string] }>()

// Token-only segment palette (no hardcoded colors), cycled by index.
// Figma: wheel segments use the categorical chart series tokens (color/chart/series-1…8).
const PALETTE = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `var(--color-chart-series-${i})`)

const CENTER = 100
const RADIUS = 92
const LABEL_RADIUS = 60

const rotation = ref(0)
const spinning = ref(false)
const result = ref<string | null>(null)
// Index of the settled winner, or null while idle/spinning. Drives dimming the other segments so
// the chosen one stands out under the pointer.
const winnerIndex = ref<number | null>(null)
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
      index: i,
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
  // Clear the previous winner so all segments are lit again while the wheel turns.
  winnerIndex.value = null
  result.value = null
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

function onTransitionEnd(event: TransitionEvent): void {
  // The rotor's `transform` ending is the wheel stopping. The segments' `opacity` transition (fading
  // the losers) also bubbles a transitionend here — ignore it, otherwise starting a new spin (which
  // un-dims the previous winner) would fire this early and light up the winner mid-spin.
  if (event.propertyName !== 'transform') return
  if (!spinning.value) return
  spinning.value = false
  winnerIndex.value = chosenIndex
  result.value = props.names[chosenIndex]
  emit('result', props.names[chosenIndex])
}

defineExpose({ spin, canSpin, spinning })
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
          <g
            v-for="seg in segments"
            :key="seg.name"
            class="spinner__seg"
            :class="{ 'spinner__seg--dim': winnerIndex !== null && seg.index !== winnerIndex }"
          >
            <path :d="seg.path" :fill="seg.color" stroke="var(--color-bg-canvas)" stroke-width="1" />
            <text
              :x="seg.lx"
              :y="seg.ly"
              class="spinner__label"
              text-anchor="middle"
              dominant-baseline="middle"
            >
              {{ seg.label }}
            </text>
          </g>
        </g>
        <!-- Outer rim + hub (static, drawn over the rotor) frame the wheel. -->
        <circle :cx="CENTER" :cy="CENTER" r="93" fill="none" stroke="var(--border-subtle)" stroke-width="2" />
        <circle :cx="CENTER" :cy="CENTER" r="10" fill="var(--surface-raised)" stroke="var(--border-strong)" stroke-width="1.5" />
        <circle :cx="CENTER" :cy="CENTER" r="3.5" fill="var(--color-accent-solid)" />
      </svg>
    </div>

    <div v-if="!hideControls" class="spinner__controls">
      <Button variant="primary" :disabled="!canSpin" :loading="spinning" @click="spin">Spin</Button>
      <p v-if="result && !hideResult" class="spinner__result">
        <span class="spinner__result-tag">Winner</span>
        <span class="spinner__result-name">{{ result }}</span>
      </p>
      <p v-else-if="names.length < 2" class="spinner__hint">Add at least 2 restaurants to spin.</p>
    </div>
  </div>
</template>

<style scoped>
/* Figma wheel: chart-series segments, text/on-accent labels, text/primary pointer, raised hub. */
.spinner { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); width: 100%; }
.spinner__wheel-wrap { position: relative; width: 100%; max-width: 440px; aspect-ratio: 1; padding-top: 12px; box-sizing: content-box; }
.spinner__wheel { display: block; width: 100%; height: 100%; }
.spinner__rotor { transform-origin: 100px 100px; transition: transform 3.2s cubic-bezier(0.16, 1, 0.3, 1); }
/* After the wheel settles, fade the losing segments so the winner under the pointer stands out. */
.spinner__seg { transition: opacity var(--duration-slow) var(--ease-standard); }
.spinner__seg--dim { opacity: 0.35; }
.spinner__label { fill: var(--color-text-on-accent); font-family: var(--font-body); font-size: 7px; font-weight: var(--weight-medium); pointer-events: none; }
.spinner__pointer { position: absolute; top: 0; left: 50%; z-index: 1; width: 0; height: 0; transform: translateX(-50%); border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 22px solid var(--color-text-primary); filter: drop-shadow(0 0 1px var(--color-bg-canvas)); }
.spinner__controls { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
.spinner__result { display: flex; align-items: center; gap: var(--space-2); margin: 0; }
.spinner__result-tag { padding: var(--space-0-5) var(--space-2); border: var(--border-thin) solid var(--color-accent-border); border-radius: var(--radius-full); background: var(--color-accent-subtle); color: var(--color-accent-text); font-size: 12px; line-height: 16px; font-weight: var(--weight-medium); }
.spinner__result-name { font-size: 22px; line-height: 28px; font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.spinner__hint { margin: 0; font-size: 14px; line-height: 20px; color: var(--color-text-muted); }
@media (prefers-reduced-motion: reduce) { .spinner__rotor { transition-duration: 0.01s; } }
</style>
