// The Coordinate Grid Generator's presets: two built in, plus any the teacher
// saves in this browser.

import { createPresetStore } from '$lib/shared/presetStore.js'
import { DEFAULT_SETTINGS, GRAPH_KEYS, cleanSettings } from './settings.js'

export const BUILT_IN_PRESETS = [
  { name: 'First quadrant', settings: { ...DEFAULT_SETTINGS } },
  {
    name: 'All four quadrants',
    settings: { ...DEFAULT_SETTINGS, xBlocks: 20, yBlocks: 20, xStart: -10, yStart: -10 },
  },
]

const figureOnly = (s) => Object.fromEntries(GRAPH_KEYS.map((k) => [k, s[k]]))

export const presetStore = createPresetStore('mathfigures.coordinate-grid.presets', (s) => figureOnly(cleanSettings(s)))
