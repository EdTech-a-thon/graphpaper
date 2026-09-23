// Every choice the teacher makes, with its default. The page address carries
// any non-default values so a graph can be bookmarked or shared.

export const MAX_BLOCKS = 50
export const EVERY = [1, 2, 5, 10, 0] // number every nth line; 0 = no numbers

export const DEFAULT_SETTINGS = {
  xBlocks: 15,
  yBlocks: 15,
  xStep: 1,
  yStep: 1,
  layout: 'q1', // 'q1' first quadrant, 'four' all four, 'custom' pick start values
  xStart: 0,
  yStart: 0,
  xEvery: 1,
  yEvery: 1,
  title: '',
  xLabel: 'x',
  yLabel: 'y',
  blanks: false, // draw write-on lines where a title or label is left empty
  arrows: true,
  light: false, // gray grid lines instead of black
  points: '',
  style: 'dots', // 'dots' | 'both' | 'line'
  lineOn: false,
  m: 1,
  b: 0,
  copies: 1,
}

const num = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/** Tidy raw form values (number inputs can be empty) into usable settings. */
export function cleanSettings(s) {
  const d = DEFAULT_SETTINGS
  const blocks = (v, f) => clamp(Math.round(num(v, f)), 1, MAX_BLOCKS)
  const step = (v) => (num(v, 1) > 0 ? num(v, 1) : 1)
  return {
    ...s,
    xBlocks: blocks(s.xBlocks, d.xBlocks),
    yBlocks: blocks(s.yBlocks, d.yBlocks),
    xStep: step(s.xStep),
    yStep: step(s.yStep),
    layout: ['q1', 'four', 'custom'].includes(s.layout) ? s.layout : 'q1',
    xStart: num(s.xStart, 0),
    yStart: num(s.yStart, 0),
    xEvery: EVERY.includes(s.xEvery) ? s.xEvery : 1,
    yEvery: EVERY.includes(s.yEvery) ? s.yEvery : 1,
    style: ['dots', 'both', 'line'].includes(s.style) ? s.style : 'dots',
    m: num(s.m, 0),
    b: num(s.b, 0),
    copies: [1, 2, 4].includes(s.copies) ? s.copies : 1,
  }
}

/** The value at the first line of an axis, given the layout. */
export function axisStart(blocks, step, layout, start) {
  if (layout === 'four') return -Math.floor(blocks / 2) * step
  if (layout === 'custom') return start
  return 0
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

/** Pull (x, y) pairs out of whatever the teacher typed: "(1,2) (3,4)", "1 2\n3 4", … */
export function parsePoints(text) {
  const nums = (text.match(/-?\d*\.?\d+/g) ?? []).map(Number)
  const pts = []
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]])
  return pts
}

/** A tick number, free of float noise, with a true minus sign. */
export function fmt(v) {
  const n = Number(v.toFixed(10))
  return (Object.is(n, -0) ? 0 : n).toString().replace('-', '−')
}
