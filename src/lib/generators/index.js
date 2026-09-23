// Every generator on the site. The directory and its search, page titles
// and the sitemap all read this list, so adding a generator means adding its
// folder and one entry here.

import CoordinateGridPreview from './coordinate-grid/Preview.svelte'

/**
 * @typedef {object} Generator
 * @property {string} id
 * @property {string} name        page title, e.g. "Coordinate Grid Generator"
 * @property {string} path        its address on the site
 * @property {string} blurb       one line for the directory card
 * @property {string} description the page's search engine description
 * @property {string[]} keywords  words teachers might search for instead of the name
 * @property {any} Preview        component drawing a sample figure
 */

/** @type {Generator[]} */
export const GENERATORS = [
  {
    id: 'coordinate-grid',
    name: 'Coordinate Grid Generator',
    path: '/coordinate-grid',
    blurb: 'Square grids with x- and y-axes, for plotting points and lines.',
    description:
      'Make a printable coordinate grid (graph paper) for your class. Choose the size, scale, numbering, titles and axis arrows, then copy it into a worksheet or test.',
    keywords: [
      'graph paper', 'grid paper', 'coordinate plane', 'cartesian plane', 'cartesian coordinate plane',
      'cartesian coordinates', 'rectangular coordinates', 'xy plane', 'x-y grid', 'xy', 'axes', 'x-axis', 'y-axis',
      'quadrant', 'first quadrant', 'four quadrants', 'origin', 'ordered pairs', 'plot points', 'plotting',
      'graphing', 'linear equations', 'slope', 'grid', 'graph', 'blank graph', 'printable',
    ],
    Preview: CoordinateGridPreview,
  },
]

export const findGenerator = (path) => GENERATORS.find((g) => g.path === path)

const words = (text) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

/** Generators matching a search. Every word typed must start some word in the
 *  generator's name, blurb or keywords, so "quad" finds the Coordinate Grid. */
export function searchGenerators(query) {
  const wanted = words(query)
  if (!wanted.length) return GENERATORS
  return GENERATORS.filter((g) => {
    const have = words([g.name, g.blurb, ...g.keywords].join(' '))
    return wanted.every((w) => have.some((h) => h.startsWith(w)))
  })
}
