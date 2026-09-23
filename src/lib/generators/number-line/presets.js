// The Number Line Generator's presets: a few built in, plus any the teacher
// saves in this browser.

import { createPresetStore } from '$lib/shared/presetStore.js'
import { DEFAULT_SETTINGS, FIGURE_KEYS, cleanSettings } from './settings.js'

export const BUILT_IN_PRESETS = [
  { name: 'Integers −10 to 10', settings: { ...DEFAULT_SETTINGS } },
  { name: '0 to 1 in tenths', settings: { ...DEFAULT_SETTINGS, from: '0', to: '1', step: '0.1' } },
  { name: 'Inequality', settings: { ...DEFAULT_SETTINGS, inequality: 'x < -1 or x >= 3' } },
  { name: '0 to 2π', settings: { ...DEFAULT_SETTINGS, from: '0', to: '2pi', step: 'pi/4', numbering: 'pi' } },
]

const figureOnly = (s) => ({ ...DEFAULT_SETTINGS, ...Object.fromEntries(FIGURE_KEYS.map((k) => [k, s[k]])) })

export const presetStore = createPresetStore('mathfigures.number-line.presets', (s) => figureOnly(cleanSettings(s)))
