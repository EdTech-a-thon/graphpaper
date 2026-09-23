// Lays out a coordinate grid as plain numbers for Graph.svelte to draw. Every
// block is a square of CELL units; the SVG scales to fit wherever it's shown.

import { axisStart, fmt, parsePoints } from './settings.js'

export const CELL = 32
const FS = 14 // tick-number font size
const PAD = 14
const EXT = 20 // how far an arrowed axis runs past the grid
const CHAR = FS * 0.6 // rough width of one digit

/** Short labels like "x" or "y" sit at the arrow tip; longer ones run along the side. */
const isShort = (label) => label.trim().length > 0 && label.trim().length <= 2

function ticks(blocks, step, start, every) {
  // Count from the line at 0 when there is one, so "every 5" gives 0, 5, 10…
  const zero = -start / step
  const z = Math.round(zero)
  const ref = Math.abs(zero - z) < 1e-9 && z >= 0 && z <= blocks ? z : 0
  const out = []
  if (!every) return out
  for (let i = 0; i <= blocks; i++) {
    if ((i - ref) % every === 0) out.push({ i, text: fmt(start + i * step) })
  }
  return out
}

export function buildGraph(s) {
  const x0 = axisStart(s.xBlocks, s.xStep, s.layout, s.xStart)
  const y0 = axisStart(s.yBlocks, s.yStep, s.layout, s.yStart)
  const x1 = x0 + s.xBlocks * s.xStep
  const y1 = y0 + s.yBlocks * s.yStep
  const gridW = s.xBlocks * CELL
  const gridH = s.yBlocks * CELL

  // Axes cross at 0 when 0 is on the grid, otherwise they run along the left and bottom edges.
  const yAxisInside = x0 < 0 && x1 > 0
  const xAxisInside = y0 < 0 && y1 > 0

  const xTicks = ticks(s.xBlocks, s.xStep, x0, s.xEvery)
  const yTicks = ticks(s.yBlocks, s.yStep, y0, s.yEvery)
  const ext = s.arrows ? EXT : 0

  const title = s.title.trim()
  const xLabel = s.xLabel.trim()
  const yLabel = s.yLabel.trim()
  const titleRow = title || s.blanks
  const xSide = xLabel ? !isShort(xLabel) : s.blanks // label (or blank) under the grid
  const ySide = yLabel ? !isShort(yLabel) : s.blanks
  const xTip = isShort(xLabel)
  const yTip = isShort(yLabel)

  const yNumW = !yAxisInside && yTicks.length ? Math.max(...yTicks.map((t) => t.text.length)) * CHAR + 8 : 0
  const xNumH = !xAxisInside && xTicks.length ? FS + 8 : 0
  const lastX = xTicks.at(-1)?.text.length ?? 0

  const L = PAD + (ySide ? FS * 1.2 + 12 : 0) + Math.max(ext, yNumW)
  const T = PAD + (titleRow ? FS * 1.6 + 14 : 0) + ext + (yTip ? FS * 1.3 + 4 : 0)
  const R = PAD + Math.max((lastX * CHAR) / 2, ext + (xTip ? xLabel.length * FS * 0.8 + 8 : 0))
  const B = PAD + Math.max(ext, Math.max(xNumH, yAxisInside ? ext : 0) + (xSide ? FS * 1.2 + 14 : 0))

  const px = (v) => L + ((v - x0) / s.xStep) * CELL
  const py = (v) => T + gridH - ((v - y0) / s.yStep) * CELL
  const axisX = yAxisInside ? px(0) : L
  const axisY = xAxisInside ? py(0) : T + gridH

  // Tick numbers: x below the x-axis, y to the left of the y-axis. Where the
  // axes cross, a shared value is written once (like the "0" in the corner).
  const onYAxis = (i) => Math.abs(L + i * CELL - axisX) < 0.5
  const onXAxis = (j) => Math.abs(T + gridH - j * CELL - axisY) < 0.5
  const xCross = xTicks.find((t) => onYAxis(t.i))
  const yCross = yTicks.find((t) => onXAxis(t.i))
  const numbers = []
  for (const t of xTicks) {
    const x = L + t.i * CELL
    const cross = t === xCross
    numbers.push({ x: cross ? x - 8 : x, y: axisY + FS + 3, text: t.text, anchor: cross ? 'end' : 'middle' })
  }
  for (const t of yTicks) {
    const y = T + gridH - t.i * CELL
    if (t === yCross && xCross && xCross.text === t.text) continue
    numbers.push({ x: axisX - 6, y: t === yCross ? y - 5 : y + FS * 0.35, text: t.text, anchor: 'end' })
  }

  // Titles, axis labels, and write-on lines for any left blank.
  const labels = []
  const blanks = []
  const midX = L + gridW / 2
  const midY = T + gridH / 2
  const titleY = PAD + FS * 1.6
  if (title) labels.push({ x: midX, y: titleY, text: title, kind: 'title' })
  else if (s.blanks) blanks.push({ x1: midX - Math.min(130, gridW / 2), y1: titleY, x2: midX + Math.min(130, gridW / 2), y2: titleY })

  const xSideY = T + gridH + Math.max(xNumH, yAxisInside ? ext : 0) + FS * 1.2 + 6
  if (xTip) labels.push({ x: L + gridW + ext + 6, y: axisY + FS * 0.4, text: xLabel, kind: 'tip', anchor: 'start' })
  else if (xLabel) labels.push({ x: midX, y: xSideY, text: xLabel, kind: 'side' })
  else if (s.blanks) blanks.push({ x1: midX - Math.min(100, gridW / 2), y1: xSideY, x2: midX + Math.min(100, gridW / 2), y2: xSideY })

  const ySideX = PAD + FS * 0.9
  if (yTip) labels.push({ x: axisX, y: T - ext - 6, text: yLabel, kind: 'tip', anchor: 'middle' })
  else if (yLabel) labels.push({ x: ySideX, y: midY, text: yLabel, kind: 'side', rotate: true })
  else if (s.blanks) blanks.push({ x1: ySideX, y1: midY - Math.min(100, gridH / 2), x2: ySideX, y2: midY + Math.min(100, gridH / 2) })

  // Optional data: points (dots and/or joined) and a line y = mx + b.
  const pts = parsePoints(s.points).map(([x, y]) => [px(x), py(y)])
  const line = s.lineOn ? { x1: px(x0), y1: py(s.m * x0 + s.b), x2: px(x1), y2: py(s.m * x1 + s.b) } : null

  return {
    width: L + gridW + R,
    height: T + gridH + B,
    fs: FS,
    grid: { x: L, y: T, w: gridW, h: gridH },
    vLines: Array.from({ length: s.xBlocks + 1 }, (_, i) => L + i * CELL),
    hLines: Array.from({ length: s.yBlocks + 1 }, (_, j) => T + j * CELL),
    xAxis: { x1: L - ext, x2: L + gridW + ext, y: axisY },
    yAxis: { y1: T + gridH + ext, y2: T - ext, x: axisX },
    numbers,
    labels,
    blanks,
    pts,
    line,
  }
}
