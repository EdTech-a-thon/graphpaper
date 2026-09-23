// Every choice the teacher makes, with its default. The page address carries
// any non-default values so a graph can be bookmarked or shared.

export const MAX_BLOCKS = 50
export const EVERY = [1, 2, 5, 10, 0] // number every nth line; 0 = no numbers
export const TITLE_MODES = ['text', 'blank', 'none'] // written title, write-on line for students, nothing
export const LABEL_MODES = ['text', 'none'] // the letter at an axis arrow, like x or y
/** How each end of an axis finishes, like line end caps in Figma. */
export const CAPS = { triangle: 'Triangle arrow', line: 'Line arrow', circle: 'Circle', none: 'None' }
const CAP_KEYS = ['xStartCap', 'xEndCap', 'yStartCap', 'yEndCap']

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
  xTitle: '', // runs along the axis, e.g. "Time (hours)"
  xTitleMode: 'none',
  yTitle: '',
  yTitleMode: 'none',
  xLabel: 'x', // sits at the arrow tip
  xLabelMode: 'text',
  yLabel: 'y',
  yLabelMode: 'text',
  xStartCap: 'triangle', // left end
  xEndCap: 'triangle', // right end
  yStartCap: 'triangle', // bottom end
  yEndCap: 'triangle', // top end
}

/** Settings that describe the graph itself, which is what a preset saves. */
export const GRAPH_KEYS = Object.keys(DEFAULT_SETTINGS)

const num = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const titleMode = (v, fallback) => (TITLE_MODES.includes(v) ? v : fallback)
const labelMode = (v, fallback) => (LABEL_MODES.includes(v) ? v : fallback)

const cap = (v, fallback) => (v in CAPS ? v : fallback)

/** Older links and presets: an axis label could be a blank line (now an axis
 *  title), and arrows were one on/off switch for every end. */
function upgrade(s) {
  const out = { ...s }
  for (const axis of ['x', 'y']) {
    if (s[`${axis}LabelMode`] === 'blank') Object.assign(out, { [`${axis}LabelMode`]: 'none', [`${axis}TitleMode`]: 'blank' })
  }
  if (s.arrows === false && CAP_KEYS.every((k) => s[k] === undefined)) for (const k of CAP_KEYS) out[k] = 'none'
  delete out.arrows
  delete out.light
  return out
}

/** Tidy raw form values (number inputs can be empty) into usable settings. */
export function cleanSettings(s) {
  s = upgrade(s)
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
    xTitle: String(s.xTitle ?? ''),
    yTitle: String(s.yTitle ?? ''),
    xLabel: String(s.xLabel ?? ''),
    yLabel: String(s.yLabel ?? ''),
    titleMode: titleMode(s.titleMode, d.titleMode),
    xTitleMode: titleMode(s.xTitleMode, d.xTitleMode),
    yTitleMode: titleMode(s.yTitleMode, d.yTitleMode),
    xLabelMode: labelMode(s.xLabelMode, d.xLabelMode),
    yLabelMode: labelMode(s.yLabelMode, d.yLabelMode),
    ...Object.fromEntries(CAP_KEYS.map((k) => [k, cap(s[k], d[k])])),
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
  if (params.get('arrows') === '0' && !CAP_KEYS.some((k) => params.has(k))) for (const k of CAP_KEYS) s[k] = 'none'
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
