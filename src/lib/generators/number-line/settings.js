// Every choice the teacher makes, with its default. The page address carries
// any non-default values so a number line can be bookmarked or shared.
//
// The range and the inequality are kept as the text the teacher typed ("π/4",
// "-2 < x <= 5"); readLine() works out what they mean.

import { CAPS } from '$lib/shared/caps.js'
import { NUMBERINGS, numberText } from '$lib/shared/numbering.js'
import { parseInequality, parseNumber } from './inequality.js'

export { CAPS }
export const MAX_TICKS = 100
export const EVERY = [1, 2, 4, 5, 10, 0] // number every nth tick; 0 = no numbers
export const TITLE_MODES = ['text', 'blank', 'none']
export const LABEL_MODES = ['text', 'none']
export const INK = '#111827'

export const DEFAULT_SETTINGS = {
  from: '-10',
  to: '10',
  step: '1',
  every: 1,
  numbering: 'decimal',
  inequality: '',
  graphColor: INK,
  title: '',
  titleMode: 'none',
  label: '', // at the right end; blank means the inequality's letter
  labelMode: 'none',
  startCap: 'triangle', // left end
  endCap: 'triangle', // right end
  showGraph: true, // off prints the blank line, as the question beside its answer key
}

/** Settings that describe the figure itself, which is what a preset saves.
 *  Whether the graph is showing is a view of the figure, so it isn't one. */
export const FIGURE_KEYS = Object.keys(DEFAULT_SETTINGS).filter((k) => k !== 'showGraph')

const text = (v, fallback) => (v === undefined || v === null ? fallback : String(v))
const oneOf = (list, v, fallback) => (list.includes(v) ? v : fallback)
const color = (v) => (/^#[0-9a-f]{6}$/i.test(v ?? '') ? v.toLowerCase() : INK)

/** Tidy raw values (from a form, a link or a stored preset) into usable settings. */
export function cleanSettings(s) {
  const d = DEFAULT_SETTINGS
  return {
    from: text(s.from, d.from),
    to: text(s.to, d.to),
    step: text(s.step, d.step),
    every: oneOf(EVERY, Number(s.every), d.every),
    numbering: s.numbering in NUMBERINGS ? s.numbering : d.numbering,
    inequality: text(s.inequality, d.inequality),
    graphColor: color(s.graphColor),
    title: text(s.title, d.title),
    titleMode: oneOf(TITLE_MODES, s.titleMode, d.titleMode),
    label: text(s.label, d.label),
    labelMode: oneOf(LABEL_MODES, s.labelMode, d.labelMode),
    startCap: s.startCap in CAPS ? s.startCap : d.startCap,
    endCap: s.endCap in CAPS ? s.endCap : d.endCap,
    showGraph: s.showGraph !== false,
  }
}

/** Do two settings draw the same figure? */
export function sameFigure(a, b) {
  const ca = cleanSettings(a)
  const cb = cleanSettings(b)
  return FIGURE_KEYS.every((k) => ca[k] === cb[k])
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
  const s = { ...DEFAULT_SETTINGS }
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    if (!params.has(key)) continue
    const raw = params.get(key)
    s[key] = typeof def === 'boolean' ? raw === '1' : typeof def === 'number' ? Number(raw) : raw
  }
  return cleanSettings(s)
}

/**
 * What the settings mean: the range as numbers, the inequality as intervals,
 * and anything the teacher should fix, as messages for the settings panel.
 * When the range can't be used, the line falls back to the default range so
 * there is always a figure.
 */
export function readLine(s) {
  const problems = { from: null, to: null, step: null, inequality: null }
  const from = parseNumber(s.from)
  const to = parseNumber(s.to)
  const step = parseNumber(s.step)
  if (from === null) problems.from = 'Type a number, like −10, 2.5, 1/2 or −2π.'
  if (to === null) problems.to = 'Type a number, like 10, 2.5, 1/2 or 2π.'
  if (step === null) problems.step = 'Type a number, like 1, 0.5, 1/4 or π/6.'
  else if (step <= 0) problems.step = 'Count by a number bigger than 0.'
  if (from !== null && to !== null && from >= to) problems.to = `The line has to end after it starts, so make this bigger than ${numberText(from, s.numbering)}.`
  const ticks = !problems.from && !problems.to && !problems.step ? Math.floor((to - from) / step + 1e-9) : 0
  if (ticks > MAX_TICKS) problems.step = `That makes ${ticks} ticks. Count by a bigger number (${MAX_TICKS} ticks at most).`

  const rangeOk = !problems.from && !problems.to && !problems.step
  const range = rangeOk ? { from, to, step } : { from: -10, to: 10, step: 1 }

  const inequality = parseInequality(s.inequality)
  problems.inequality = inequality.error
  if (inequality.set) {
    const outside = inequality.set
      .flatMap(({ lo, hi }) => [lo.v, hi.v])
      .filter((v) => Number.isFinite(v) && (v < range.from - 1e-9 || v > range.to + 1e-9))
    if (outside.length) {
      const v = numberText(outside[0], s.numbering)
      problems.inequality = `${v} is past the end of the line. Widen the range to show it.`
    }
  }

  return { range, set: inequality.set, variable: inequality.variable, problems }
}
