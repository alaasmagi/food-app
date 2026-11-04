import type { CSSProperties } from 'vue'

/** Map coordinate: a number is a percentage of the map box, a string is any CSS length. */
export type MapCoord = number | string

export function at(x: MapCoord, y: MapCoord): CSSProperties {
  return {
    left: typeof x === 'number' ? `${x}%` : x,
    top: typeof y === 'number' ? `${y}%` : y,
  }
}
