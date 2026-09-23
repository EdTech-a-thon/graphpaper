// The Coordinate Grid Generator's presets: the ones the teacher saves in this
// browser. There are none built in.

import { createPresetStore } from '$lib/shared/presetStore.js'
import { GRAPH_KEYS, cleanSettings } from './settings.js'

const figureOnly = (s) => Object.fromEntries(GRAPH_KEYS.map((k) => [k, s[k]]))

export const presetStore = createPresetStore('mathfigures.coordinate-grid.presets', (s) => figureOnly(cleanSettings(s)))
