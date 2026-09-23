// The Coordinate Grid Generator's presets: a few built in, plus any the teacher
// saves in this browser.

import { createPresetStore } from '$lib/shared/presetStore.js'
import { DEFAULT_SETTINGS, GRAPH_KEYS, cleanSettings } from './settings.js'

export const BUILT_IN_PRESETS = [
  { name: 'First quadrant', settings: { ...DEFAULT_SETTINGS } },
  {
    name: 'All four quadrants',
    settings: { ...DEFAULT_SETTINGS, xFrom: '-10', xTo: '10', yFrom: '-10', yTo: '10' },
  },
  {
    name: 'Trig graph',
    settings: { ...DEFAULT_SETTINGS, xFrom: '0', xTo: '2pi', xStep: 'pi/4', xEvery: 2, xNumbering: 'pi', yFrom: '-2', yTo: '2', yStep: '0.5', yEvery: 2 },
  },
]

const figureOnly = (s) => Object.fromEntries(GRAPH_KEYS.map((k) => [k, s[k]]))

export const presetStore = createPresetStore('mathfigures.coordinate-grid.presets', (s) => figureOnly(cleanSettings(s)))
