// Every choice the teacher makes, with its default. The page address carries
// any non-default values so a number line can be bookmarked or shared.
//
// The range and the equations are kept as the text the teacher typed ("π/4",
// "-2 < x <= 5", "3, -1"); readLine() works out what they mean.

import { niceText, numberingOf } from '$lib/shared/numbering.js'
import { parseInequality, parseNumber } from './inequality.js'

export const MAX_TICKS = 100
export const EVERY = [1, 2, 4, 5, 10, 0] // number every nth tick; 0 = no numbers
export const POINTS = ['dot', 'cross'] // how points are marked: a dot, or a cross as in France
export const INK = '#111827'

export const DEFAULT_SETTINGS = {
  from: '-10',
  to: '10',
  step: '1',
  every: 1,
  points: 'dot',
  equations: [], // what's graphed, one row each: an equation or inequality, or points
}

/** Settings that describe the figure itself, which is what a preset saves. */
export const FIGURE_KEYS = Object.keys(DEFAULT_SETTINGS)

const text = (v, fallback) => (v === undefined || v === null ? fallback : String(v))
const oneOf = (list, v, fallback) => (list.includes(v) ? v : fallback)

/** Tidy raw values (from a form, a link or a stored preset) into usable settings.
 *  Older links and presets had one equation, called `inequality`. */
export function cleanSettings(s) {
  const d = DEFAULT_SETTINGS
  const equations = Array.isArray(s.equations) ? s.equations : s.inequality ? [s.inequality] : d.equations
  return {
    from: text(s.from, d.from),
    to: text(s.to, d.to),
    step: text(s.step, d.step),
    every: oneOf(EVERY, Number(s.every), d.every),
    points: oneOf(POINTS, s.points, d.points),
    equations: equations.map((e) => text(e, '')),
  }
}

const filled = (equations) => equations.map((e) => e.trim()).filter(Boolean)

/** Do two settings draw the same figure? */
export function sameFigure(a, b) {
  const ca = cleanSettings(a)
  const cb = cleanSettings(b)
  return FIGURE_KEYS.every((k) => (k === 'equations' ? filled(ca[k]).join('\n') === filled(cb[k]).join('\n') : ca[k] === cb[k]))
}

export function settingsToQuery(s) {
  const params = new URLSearchParams()
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    const v = s[key]
    if (key === 'equations' || v === def || v === null || v === undefined) continue
    params.set(key, String(v))
  }
  // One eq= per row that has something in it.
  for (const e of filled(s.equations ?? [])) params.append('eq', e)
  return params.toString()
}

export function settingsFromParams(params) {
  const s = { ...DEFAULT_SETTINGS, equations: params.getAll('eq') }
  if (!s.equations.length && params.has('inequality')) s.equations = [params.get('inequality')]
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    if (key === 'equations' || !params.has(key)) continue
    const raw = params.get(key)
    s[key] = typeof def === 'number' ? Number(raw) : raw
  }
  return cleanSettings(s)
}

/**
 * What the settings mean: the range as numbers, each row as intervals (the
 * equations' together in `set` and the points' values in `points`, all drawn
 * over one another),
 * how to write the numbers of each (the way the teacher typed them: π as π,
 * fractions as fractions), and anything the teacher should fix, as messages
 * for the settings panel.
 * When the range can't be used, the line falls back to the default range so
 * there is always a figure.
 */
export function readLine(s) {
  const problems = { from: null, to: null, step: null }
  const from = parseNumber(s.from)
  const to = parseNumber(s.to)
  const step = parseNumber(s.step)
  const numbering = numberingOf(s.from, s.to, s.step)
  const endpointNumbering = numberingOf(...s.equations)
  if (from === null) problems.from = 'Type a number, like −10, 2.5, 1/2 or −2π.'
  if (to === null) problems.to = 'Type a number, like 10, 2.5, 1/2 or 2π.'
  if (step === null) problems.step = 'Type a number, like 1, 0.5, 1/4 or π/6.'
  else if (step <= 0) problems.step = 'Count by a number bigger than 0.'
  if (from !== null && to !== null && from >= to) problems.to = `The line has to end after it starts, so make this bigger than ${niceText(from, numbering)}.`
  const ticks = !problems.from && !problems.to && !problems.step ? Math.floor((to - from) / step + 1e-9) : 0
  if (ticks > MAX_TICKS) problems.step = `That makes ${ticks} ticks. Count by a bigger number (${MAX_TICKS} ticks at most).`

  const rangeOk = !problems.from && !problems.to && !problems.step
  const range = rangeOk ? { from, to, step } : { from: -10, to: 10, step: 1 }

  // One read per row, in order; a blank row is null.
  const rows = s.equations.map((text) => {
    const read = parseInequality(text)
    if (!read.set && !read.error) return null
    let problem = read.error
    if (read.set) {
      const outside = read.set
        .flatMap(({ lo, hi }) => [lo.v, hi.v])
        .filter((v) => Number.isFinite(v) && (v < range.from - 1e-9 || v > range.to + 1e-9))
      if (outside.length) problem = `${niceText(outside[0], endpointNumbering)} is past the end of the line. Widen the range to show it.`
    }
    return { set: read.set, points: read.points, problem }
  })
  const set = rows.flatMap((r) => (r && !r.points ? r.set ?? [] : []))
  const points = rows.flatMap((r) => (r?.points ? r.set.map(({ lo }) => lo.v) : []))

  return { range, numbering, endpointNumbering, set, points, rows, problems }
}
