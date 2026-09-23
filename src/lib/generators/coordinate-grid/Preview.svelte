<script>
  // The Coordinate Grid Generator's picture on the directory: a real grid,
  // drawn by the same code the generator uses.
  import Graph from './Graph.svelte'
  import { DEFAULT_SETTINGS, cleanSettings } from './settings.js'

  const settings = cleanSettings({ ...DEFAULT_SETTINGS, xBlocks: 12, yBlocks: 12, xStart: -6, yStart: -6, xEvery: 2, yEvery: 2 })
</script>

<Graph {settings} id="preview-coordinate-grid" />
