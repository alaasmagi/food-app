import { CARTO_API_KEY } from '../../config'
import type { Theme } from '../../composables/useTheme'

const keyParam = CARTO_API_KEY ? `?key=${encodeURIComponent(CARTO_API_KEY)}` : ''

export const TILE_URL: Record<Theme, string> = {
  dark: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${keyParam}`,
  light: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${keyParam}`,
}
