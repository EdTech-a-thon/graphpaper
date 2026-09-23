// Reading what a teacher types to graph on a coordinate grid, with Caret (see
// docs/adr/0002-caret-for-math-input.md): a straight line like y = 2x + 1,
// 2x + 3y = 6 or x = 4, or points like (2, 3) or (1, 2), (3, 4). Algebra 1
// only for now: no curves and no shaded inequalities. Runs on the server too.

import { CommaListNode, ComparisonNode, ParenthesesChildTag, VariableNode, evaluate } from '@caret-js/math'
import { fromText, parsers } from '$lib/shared/math.js'
import { fmt } from '$lib/shared/numbering.js'

const EXAMPLE = 'Try a line like y = 2x + 1, a point like (2, 3), or a list of points like (2, 3), (1, 4).'

class ReadError extends Error {}

/** How a row is drawn. Colors print well in color and read as distinct in gray. */
export const COLORS = {
  black: '#111827',
  blue: '#2563eb',
  red: '#dc2626',
  green: '#15803d',
  orange: '#ea580c',
  purple: '#7c3aed',
}
export const LINE_STYLES = { solid: 'Solid', dashed: 'Dashed', dotted: 'Dotted' }
// Which ends of a line get an arrowhead. "left" is the end with the smaller x
// (the bottom, for an up-and-down line).
export const ARROWS = { both: 'Both ends', none: 'No arrows', left: 'Left end', right: 'Right end' }
export const ROW_DEFAULTS = { text: '', color: 'black', line: 'solid', arrows: 'both' }

const STYLE_KEYS = { color: COLORS, line: LINE_STYLES, arrows: ARROWS }

/** A row from a form, a stored preset or an older link (just its text). */
export function cleanRow(r) {
  if (typeof r !== 'object' || r === null) return { ...ROW_DEFAULTS, text: String(r ?? '') }
  const out = { ...ROW_DEFAULTS, text: String(r.text ?? '') }
  for (const [k, list] of Object.entries(STYLE_KEYS)) if (r[k] in list) out[k] = r[k]
  return out
}

/** A row as one value in the page address: "y=2x+1", or "y=2x+1|color=red|line=dashed". */
export function rowToParam(r) {
  const style = Object.keys(STYLE_KEYS).filter((k) => r[k] !== ROW_DEFAULTS[k]).map((k) => `${k}=${r[k]}`)
  return [r.text.trim(), ...style].join('|')
}

export function rowFromParam(value) {
  const [text, ...style] = String(value).split('|')
  return cleanRow({ text, ...Object.fromEntries(style.map((kv) => kv.split('='))) })
}

/** A bracketed pair like (2, 3) as { x, y }. */
function point(node) {
  if (!(node instanceof CommaListNode && node.hasTag(ParenthesesChildTag) && node.expressions.length === 2)) {
    throw new ReadError('Write each point as (x, y), like (2, 3). For more than one, put commas between them: (2, 3), (1, 4).')
  }
  const [x, y] = node.expressions.map((n) => evaluate(n))
  if (x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y)) {
    throw new ReadError('Each point needs two numbers, like (2, 3) or (−1/2, 4). For more than one: (2, 3), (1, 4).')
  }
  return { x, y }
}

/**
 * An equation in x and y as the line a·x + b·y + c = 0. Both sides are
 * evaluated at a few points: if the difference is linear there, it's a line.
 */
function line(node) {
  if (node.operators.length > 1) throw new ReadError('Use one = sign, like y = 2x + 1.')
  if (node.operators[0] !== '=') throw new ReadError('Shading inequalities isn’t here yet. Try a line like y = 2x + 1.')
  for (const n of node.traverse()) {
    if (n instanceof VariableNode && n.name !== 'x' && n.name !== 'y') throw new ReadError(`Use x and y, not ${n.name}.`)
  }
  const [left, right] = node.operands
  const f = (x, y) => {
    const l = evaluate(left, { x, y })
    const r = evaluate(right, { x, y })
    return l === null || r === null ? null : l - r
  }
  const c = f(0, 0)
  const a = c === null ? null : f(1, 0) - c
  const b = c === null ? null : f(0, 1) - c
  if (c === null || f(1, 0) === null || f(0, 1) === null) throw new ReadError(EXAMPLE)
  for (const [x, y] of [[2, -3], [-1.5, 4.25], [7, 11]]) {
    const v = f(x, y)
    if (v === null || Math.abs(v - (a * x + b * y + c)) > 1e-9 * Math.max(1, Math.abs(v))) {
      throw new ReadError('Only straight lines for now, like y = 2x + 1 or x = 4.')
    }
  }
  if (Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12) {
    throw new ReadError(Math.abs(c) < 1e-12 ? 'That’s true for every point, so there’s no line to draw.' : 'That’s never true, so there’s no line to draw.')
  }
  return { a, b, c }
}

/**
 * Read one row. Blank text draws nothing.
 * @returns {{ line?: { a: number, b: number, c: number }, points?: { x: number, y: number }[], error?: string } | null}
 */
export function parseEquation(text) {
  if (!String(text ?? '').trim()) return null
  if (String(text).includes('^')) return { error: 'Exponents aren’t here yet, so only straight lines, like y = 2x + 1.' }
  try {
    const node = parsers.equation.parse(fromText(text))
    if (node instanceof ComparisonNode) return { line: line(node) }
    if (node instanceof CommaListNode) {
      const items = node.hasTag(ParenthesesChildTag) ? [node] : node.expressions
      return { points: items.map(point) }
    }
    throw new ReadError(EXAMPLE)
  } catch (e) {
    if (e instanceof ReadError) return { error: e.message }
    throw e
  }
}

/**
 * The line a·x + b·y + c = 0 clipped to a box of values, as its two ends, or
 * null when it misses the box.
 */
export function clipLine({ a, b, c }, box) {
  // Walk along the line from a point on it: p + t·d, d = (b, −a).
  const p = Math.abs(b) > Math.abs(a) ? { x: 0, y: -c / b } : { x: -c / a, y: 0 }
  const d = { x: b, y: -a }
  let lo = -Infinity
  let hi = Infinity
  for (const [k, min, max] of [['x', box.x0, box.x1], ['y', box.y0, box.y1]]) {
    if (Math.abs(d[k]) < 1e-12) {
      if (p[k] < min - 1e-9 || p[k] > max + 1e-9) return null
      continue
    }
    const [t1, t2] = [(min - p[k]) / d[k], (max - p[k]) / d[k]].sort((m, n) => m - n)
    lo = Math.max(lo, t1)
    hi = Math.min(hi, t2)
  }
  if (!(hi - lo > 1e-9)) return null
  const at = (t) => ({ x: p.x + t * d.x, y: p.y + t * d.y })
  return [at(lo), at(hi)]
}

const inBox = ({ x, y }, box) => x >= box.x0 - 1e-9 && x <= box.x1 + 1e-9 && y >= box.y0 - 1e-9 && y <= box.y1 + 1e-9

/**
 * Every row, read and fitted to the grid's box of values: a line's two ends
 * on the grid's edge, the points on the grid, and a problem for the settings
 * panel when a row can't be read or doesn't show.
 */
export function readEquations(texts, box) {
  return texts.map((text) => {
    const read = parseEquation(text)
    if (!read) return null
    if (read.error) return { problem: read.error }
    if (read.line) {
      const ends = clipLine(read.line, box)
      return ends ? { ends } : { problem: 'That line misses the grid. Widen the axes to show it.' }
    }
    const off = read.points.find((pt) => !inBox(pt, box))
    return {
      points: read.points.filter((pt) => inBox(pt, box)),
      problem: off ? `(${fmt(off.x)}, ${fmt(off.y)}) is off the grid. Widen the axes to show it.` : null,
    }
  })
}
