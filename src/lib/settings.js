// Every choice the teacher makes, with its default. The page address carries
// any non-default values so a graph can be bookmarked or shared.

export const MAX_BLOCKS = 50
export const EVERY = [1, 2, 5, 10, 0] // number every nth line; 0 = no numbers
export const LABEL_MODES = ['text', 'blank', 'none'] // written label, write-on line for students, nothing

export const DEFAULT_SETTINGS = {
  xBlocks: 15,
  yBlocks: 15,
  xStep: 1,
  yStep: 1,
  xStart: 0,
  yStart: 0,
  xEvery: 1,
  yEvery: 1,
  title: '',
  titleMode: 'none',
  xLabel: 'x',
  xLabelMode: 'text',
  yLabel: 'y',
  yLabelMode: 'text',
  arrows: true,
  light: false, // gray grid lines instead of black
}

/** Settings that describe the graph itself, which is what a preset saves. */
export const GRAPH_KEYS = Object.keys(DEFAULT_SETTINGS)

const num = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const mode = (v, fallback) => (LABEL_MODES.includes(v) ? v : fallback)

/** Tidy raw form values (number inputs can be empty) into usable settings. */
export function cleanSettings(s) {
  const d = DEFAULT_SETTINGS
  const blocks = (v, f) => clamp(Math.round(num(v, f)), 1, MAX_BLOCKS)
  const step = (v) => (num(v, 1) > 0 ? num(v, 1) : 1)
  return {
    ...d,
    ...s,
    xBlocks: blocks(s.xBlocks, d.xBlocks),
    yBlocks: blocks(s.yBlocks, d.yBlocks),
    xStep: step(s.xStep),
    yStep: step(s.yStep),
    xStart: num(s.xStart, 0),
    yStart: num(s.yStart, 0),
    xEvery: EVERY.includes(s.xEvery) ? s.xEvery : 1,
    yEvery: EVERY.includes(s.yEvery) ? s.yEvery : 1,
    title: String(s.title ?? ''),
    xLabel: String(s.xLabel ?? ''),
    yLabel: String(s.yLabel ?? ''),
    titleMode: mode(s.titleMode, d.titleMode),
    xLabelMode: mode(s.xLabelMode, d.xLabelMode),
    yLabelMode: mode(s.yLabelMode, d.yLabelMode),
    arrows: !!(s.arrows ?? d.arrows),
    light: !!(s.light ?? d.light),
  }
}

/** Do two settings draw the same graph? */
export function sameGraph(a, b) {
  const ca = cleanSettings(a)
  const cb = cleanSettings(b)
  return GRAPH_KEYS.every((k) => ca[k] === cb[k])
}

export function settingsToQuery(s) {
  const params = new URLSearchParams()
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    const v = s[key]
    if (v === def || v === null || v === undefined) continue
    params.set(key, typeof v === 'boolean' ? (v ? '1' : '0') : String(v))
  }
  return params.toString()
}

export function settingsFromParams(params) {
  const s = structuredClone(DEFAULT_SETTINGS)
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    if (!params.has(key)) continue
    const raw = params.get(key)
    if (typeof def === 'number') s[key] = Number(raw)
    else if (typeof def === 'boolean') s[key] = raw === '1'
    else s[key] = raw
  }
  return cleanSettings(s)
}

/** A tick number, free of float noise, with a true minus sign. */
export function fmt(v) {
  const n = Number(v.toFixed(10))
  return (Object.is(n, -0) ? 0 : n).toString().replace('-', '−')
}
