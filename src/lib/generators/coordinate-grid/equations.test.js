import { describe, expect, test } from 'vitest'
import { clipLine, parseEquation, readEquations } from './equations.js'
import { DEFAULT_SETTINGS, cleanSettings, settingsFromParams, settingsToQuery } from './settings.js'

const line = (text) => {
  const { a, b, c } = parseEquation(text).line
  // Scale so y's coefficient is −1 (or x's is 1 for a vertical line), to compare easily.
  const k = Math.abs(b) > 1e-12 ? -b : a
  return [a / k, b / k, c / k].map((v) => Math.round(v * 1e9) / 1e9 + 0)
}

describe('parseEquation', () => {
  test.each([
    ['y = 2x + 1', [2, -1, 1]],
    ['y=-1/2x+3', [-0.5, -1, 3]],
    ['2x + 3y = 6', [-2 / 3, -1, 2].map((v) => Math.round(v * 1e9) / 1e9)],
    ['y = 2(x - 1) + 3', [2, -1, 1]],
    ['x = 4', [1, 0, -4]],
    ['y = -3', [0, -1, -3]],
    ['y = pi x', [Math.round(Math.PI * 1e9) / 1e9, -1, 0]],
  ])('%s is a line', (text, expected) => {
    expect(line(text)).toEqual(expected)
  })

  test.each([
    ['(2, 3)', [{ x: 2, y: 3 }]],
    ['(1, 2), (3, -4)', [{ x: 1, y: 2 }, { x: 3, y: -4 }]],
    ['(-1/2, pi)', [{ x: -0.5, y: Math.PI }]],
  ])('%s is points', (text, expected) => {
    expect(parseEquation(text).points).toEqual(expected)
  })

  test.each([
    ['y = x^2', 'Exponents aren’t here yet'],
    ['y = x*x', 'Only straight lines'],
    ['y > 2x', 'Shading inequalities'],
    ['1 < y < 3', 'Use one = sign'],
    ['y = 2t', 'Use x and y, not t'],
    ['2 = 3', 'never true'],
    ['y = y', 'true for every point'],
    ['(1, 2, 3)', 'Write each point'],
    ['(1, x)', 'Each point needs two numbers'],
    ['y =', 'Try a line'],
    ['hello', 'Try a line'],
  ])('%s explains: %s', (text, start) => {
    expect(parseEquation(text).error).toContain(start)
  })

  test('blank is nothing', () => expect(parseEquation('  ')).toBeNull())
})

const box = { x0: -5, x1: 5, y0: -5, y1: 5 }

describe('clipLine', () => {
  test('a line across the grid ends on its edges', () => {
    const [p, q] = clipLine(parseEquation('y = 2x + 1').line, box)
    expect([p, q].map(({ x, y }) => [x, y].map((v) => Math.round(v * 1e9) / 1e9)).sort((m, n) => m[0] - n[0])).toEqual([
      [-3, -5],
      [2, 5],
    ])
  })
  test('a vertical line', () => {
    const ends = clipLine(parseEquation('x = 4').line, box)
    expect(ends.map((e) => e.x)).toEqual([4, 4])
  })
  test('a line off the grid', () => {
    expect(clipLine(parseEquation('y = 9').line, box)).toBeNull()
  })
})

describe('readEquations', () => {
  test('points off the grid are left out and named', () => {
    const [row] = readEquations(['(1, 1), (9, 2)'], box)
    expect(row.points).toEqual([{ x: 1, y: 1 }])
    expect(row.problem).toMatch(/^\(9, 2\) is off the grid/)
  })
})

describe('equations in the page address', () => {
  test('one eq per row, blanks dropped, in order', () => {
    const s = cleanSettings({ ...DEFAULT_SETTINGS, equations: ['y=2x+1', '', '(1,2),(3,4)'] })
    const q = settingsToQuery(s)
    expect(q).toBe('eq=y%3D2x%2B1&eq=%281%2C2%29%2C%283%2C4%29')
    expect(settingsFromParams(new URLSearchParams(q)).equations).toEqual(['y=2x+1', '(1,2),(3,4)'])
  })
  test('no rows, no eq', () => expect(settingsToQuery(cleanSettings(DEFAULT_SETTINGS))).toBe(''))
})
