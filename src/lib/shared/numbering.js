// How a tick's number is written: as a decimal, a fraction (stacked, improper) or
// a multiple of π. A number that has no neat fraction falls back to a decimal.

export const NUMBERINGS = { decimal: 'Decimals', fraction: 'Fractions', pi: 'Multiples of π' }

const MAX_DENOMINATOR = 100

/** A number, free of float noise, with a true minus sign. */
export function fmt(v) {
  const n = Number(v.toFixed(10))
  return (Object.is(n, -0) ? 0 : n).toString().replace('-', '−')
}

/** v as p/q in lowest terms with a small q, or null. */
function ratio(v) {
  for (let q = 1; q <= MAX_DENOMINATOR; q++) {
    const p = Math.round(v * q)
    if (Math.abs(p / q - v) < 1e-9) return { p, q }
  }
  return null
}

/**
 * A tick number ready to draw. Either { text } on one line, or a stacked
 * fraction { sign, num, den }, where sign is '' or '−'.
 */
export function numberLabel(v, numbering) {
  if (numbering === 'fraction') {
    const r = ratio(v)
    if (r && r.q !== 1) return { sign: r.p < 0 ? '−' : '', num: String(Math.abs(r.p)), den: String(r.q) }
  } else if (numbering === 'pi') {
    const r = ratio(v / Math.PI)
    if (r) {
      if (r.p === 0) return { text: '0' }
      const sign = r.p < 0 ? '−' : ''
      const num = `${Math.abs(r.p) === 1 ? '' : Math.abs(r.p)}π`
      return r.q === 1 ? { text: sign + num } : { sign, num, den: String(r.q) }
    }
  }
  return { text: fmt(v) }
}

/**
 * A label for a number that may not fit the numbering, like an endpoint at 3π/2
 * on a line in decimals: the numbering's own form if it is short, else π, then a
 * fraction, then a decimal rounded to hundredths.
 */
export function niceLabel(v, numbering) {
  const short = (l) => !l.text || !/\.\d{4}/.test(l.text)
  for (const n of [numbering, 'pi', 'fraction']) {
    const l = numberLabel(v, n)
    if (short(l) && (n === numbering || l.den || l.text.includes('π'))) return l
  }
  return { text: fmt(Math.round(v * 100) / 100) }
}

const oneLine = (l) => l.text ?? `${l.sign}${l.num}/${l.den}`

/** The same label on one line, for summaries and messages: "−3/2", "3π/4". */
export const numberText = (v, numbering) => oneLine(numberLabel(v, numbering))

/** niceLabel on one line. */
export const niceText = (v, numbering) => oneLine(niceLabel(v, numbering))
