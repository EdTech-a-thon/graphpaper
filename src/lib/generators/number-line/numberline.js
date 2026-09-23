// Lays out a number line as plain numbers for NumberLine.svelte to draw. The
// line is always LINE units long, whatever its range, so every figure pastes
// into a worksheet at the same width; the SVG scales to fit wherever it's shown.

import { numberLabel } from '$lib/shared/numbering.js'
import { readLine } from './settings.js'

export const LINE = 600
const FS = 16 // number font size
const PAD = 16
const EXT = 22 // how far the axis runs past its last tick where it ends in a cap
const ARROW = 11 // how much of that end the arrowhead covers
const TICK = 9 // half height of a numbered tick
const MINOR = 5 // half height of the ticks between numbers
const R = 6.5 // endpoint circle radius
const CHAR = FS * 0.6 // rough width of one digit
const EPS = 1e-9

const labelWidth = (l) => (l.text ?? (l.num.length > l.den.length ? l.num : l.den) + l.sign).length * CHAR

export function buildLine(s) {
  const { range, set, variable, problems } = readLine(s)
  const { from, to, step } = range
  const x = (v) => L + ((v - from) / (to - from)) * LINE

  // Ticks, numbering every nth one counting from the tick at 0 when there is
  // one, so "every 5" gives 0, 5, 10…
  const count = Math.floor((to - from) / step + EPS)
  const zero = -from / step
  const z = Math.round(zero)
  const ref = Math.abs(zero - z) < EPS && z >= 0 && z <= count ? z : 0
  const ticks = []
  for (let i = 0; i <= count; i++) {
    const v = from + i * step
    const numbered = !!s.every && (i - ref) % s.every === 0
    ticks.push({ v, major: numbered || !s.every, label: numbered ? numberLabel(v, s.numbering) : null })
  }

  // The inequality graph, clipped to the line. A part running off an end goes
  // on to that end, stopping short of an arrowhead so the arrow shows.
  const graph = s.showGraph && set ? set : []
  const endpoints = new Map() // value -> closed; an endpoint shared by two parts is drawn once
  for (const { lo, hi } of graph) {
    for (const b of [lo, hi]) {
      if (Number.isFinite(b.v) && b.v >= from - EPS && b.v <= to + EPS) endpoints.set(b.v, endpoints.get(b.v) || b.closed)
    }
  }
  // An endpoint without a number under it gets one above it, clear of the tick
  // numbers, so the figure is never ambiguous.
  const onNumber = (v) => ticks.some((t) => t.label && Math.abs(t.v - v) < EPS * Math.max(1, Math.abs(v)))
  const extraLabels = [...endpoints.keys()].filter((v) => !onNumber(v)).map((v) => ({ v, label: numberLabel(v, s.numbering) }))

  const labels = ticks.filter((t) => t.label)
  const stacked = labels.some((l) => l.label.den)
  const extraStacked = extraLabels.some((l) => l.label.den)
  const aboveH = extraLabels.length ? (extraStacked ? FS * 2.3 : FS) + 8 : 0
  const numbersH = labels.length ? (stacked ? FS * 2.3 : FS) + 6 : 0

  const title = s.titleMode === 'text' ? s.title.trim() : ''
  const titleBlank = s.titleMode === 'blank'
  const tip = s.labelMode === 'text' ? s.label.trim() || variable || 'x' : ''
  const TIP_CHAR = FS * 0.75
  const extL = s.startCap === 'none' ? 0 : EXT
  const extR = s.endCap === 'none' ? 0 : EXT

  const first = labels.find((l) => Math.abs(l.v - from) < EPS * Math.max(1, Math.abs(from)))
  const last = labels.find((l) => Math.abs(l.v - to) < EPS * Math.max(1, Math.abs(to)))
  const L = PAD + Math.max(extL, first ? labelWidth(first.label) / 2 : 0)
  const Rt = PAD + Math.max(last ? labelWidth(last.label) / 2 : 0, extR + (tip ? tip.length * TIP_CHAR + 8 : 0))
  const T = PAD + (title || titleBlank ? FS * 1.6 + 22 : 0) + aboveH + Math.max(TICK, R + 2)
  const axisY = T
  const height = axisY + TICK + 6 + numbersH + PAD
  const width = L + LINE + Rt

  const ends = { left: L - extL, right: L + LINE + extR }
  const segments = []
  for (const { lo, hi } of graph) {
    if (lo.v === hi.v || hi.v < from - EPS || lo.v > to + EPS) continue
    const x1 = lo.v < from - EPS ? ends.left + (s.startCap === 'triangle' || s.startCap === 'line' ? ARROW : 0) : x(lo.v)
    const x2 = hi.v > to + EPS ? ends.right - (s.endCap === 'triangle' || s.endCap === 'line' ? ARROW : 0) : x(hi.v)
    if (x2 > x1) segments.push({ x1, x2 })
  }

  // Numbers sit in a row starting at `top`; a row with any stacked fraction is taller.
  const row = (list, top, tall) =>
    list.map(({ v, label }) =>
      label.den
        ? { x: x(v), sign: label.sign, num: label.num, den: label.den, numY: top + FS * 0.85, barY: top + FS * 1.1, denY: top + FS * 2.05 }
        : { x: x(v), text: label.text, y: tall ? top + FS * 1.45 : top + FS * 0.85 },
    )
  const numbers = [
    ...row(labels, axisY + TICK + 6, stacked),
    ...row(extraLabels, axisY - Math.max(TICK, R + 2) - aboveH + 2, extraStacked),
  ]

  const titleY = PAD + FS * 1.6
  const midX = L + LINE / 2

  return {
    width,
    height,
    fs: FS,
    r: R,
    axis: { x1: ends.left, x2: ends.right, y: axisY },
    ticks: ticks.map((t) => ({ x: x(t.v), y1: axisY - (t.major ? TICK : MINOR), y2: axisY + (t.major ? TICK : MINOR) })),
    numbers,
    segments,
    endpoints: [...endpoints].map(([v, closed]) => ({ x: x(v), closed })),
    title: title ? { x: midX, y: titleY, text: title } : null,
    titleBlank: titleBlank ? { x1: midX - 130, x2: midX + 130, y: titleY } : null,
    tip: tip ? { x: ends.right + 6, y: axisY + FS * 0.45, text: tip } : null,
    problems,
  }
}
