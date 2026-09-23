// Starting points for a graph: two built in, plus any the teacher saves.
// Saved presets live in this browser's localStorage only.

import { DEFAULT_SETTINGS, GRAPH_KEYS, cleanSettings } from './settings.js'

const STORAGE_KEY = 'graphpaper.presets'

export const BUILT_IN_PRESETS = [
  { name: 'First quadrant', settings: { ...DEFAULT_SETTINGS } },
  {
    name: 'All four quadrants',
    settings: { ...DEFAULT_SETTINGS, xBlocks: 20, yBlocks: 20, xStart: -10, yStart: -10 },
  },
]

const graphOnly = (s) => Object.fromEntries(GRAPH_KEYS.map((k) => [k, s[k]]))

export function loadPresets() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(list)) return []
    return list
      .filter((p) => p && typeof p.name === 'string' && p.settings && typeof p.settings === 'object')
      .map((p) => ({ name: p.name, settings: graphOnly(cleanSettings(p.settings)) }))
  } catch {
    return []
  }
}

function store(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* storage blocked: the preset lasts until the page closes */
  }
}

/** Save (or replace, by name) a preset and return the new list. */
export function savePreset(list, name, settings) {
  const preset = { name, settings: graphOnly(cleanSettings(settings)) }
  const next = [...list.filter((p) => p.name !== name), preset]
  store(next)
  return next
}

export function deletePreset(list, name) {
  const next = list.filter((p) => p.name !== name)
  store(next)
  return next
}
