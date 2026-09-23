<script>
  // The whole tool: choose settings on the left, see the graph on the right,
  // then print it or save it as a picture. Settings are mirrored into the page
  // address so a teacher can bookmark a favourite layout.
  import Graph from './Graph.svelte'
  import { copyPng, downloadPng, downloadSvg } from './exporting.js'
  import {
    DEFAULT_SETTINGS, MAX_BLOCKS, axisStart, cleanSettings, fmt, parsePoints, settingsFromParams, settingsToQuery,
  } from './settings.js'

  let settings = $state(settingsFromParams(new URLSearchParams(window.location.search)))
  const clean = $derived(cleanSettings(settings))
  const query = $derived(settingsToQuery(clean))

  $effect(() => {
    history.replaceState(null, '', query ? `/?${query}` : '/')
  })

  const range = (axis) => {
    const blocks = clean[`${axis}Blocks`]
    const step = clean[`${axis}Step`]
    const start = axisStart(blocks, step, clean.layout, clean[`${axis}Start`])
    return `${fmt(start)} to ${fmt(start + blocks * step)}`
  }
  const pointCount = $derived(parsePoints(clean.points).length)

  const EVERY_OPTIONS = [
    [1, 'Every line'],
    [2, 'Every 2nd line'],
    [5, 'Every 5th line'],
    [10, 'Every 10th line'],
    [0, 'No numbers'],
  ]
  const LAYOUTS = [
    ['q1', 'First quadrant'],
    ['four', 'All four quadrants'],
    ['custom', 'Choose start values'],
  ]
  const STYLES = [
    ['dots', 'Dots'],
    ['both', 'Dots joined by lines'],
    ['line', 'Line only'],
  ]

  let svg = $state()
  let status = $state('')
  function flash(msg) {
    status = msg
    setTimeout(() => (status = ''), 1800)
  }
  const filename = $derived(
    (clean.title.trim() || 'graph').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'graph',
  )

  async function copyImage() {
    try {
      await copyPng(svg)
      flash('Copied! Paste it into your document.')
    } catch {
      flash('Your browser blocked copying — try Download PNG.')
    }
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      flash('Link copied.')
    } catch {
      flash('Copy the address bar to share this graph.')
    }
  }
  function reset() {
    settings = structuredClone(DEFAULT_SETTINGS)
  }
</script>

<div class="page no-print">
  <header class="intro">
    <div class="title-row">
      <img src="/favicon.svg" alt="" width="40" height="40" />
      <h1>Graph Paper Maker</h1>
    </div>
    <p>Build a coordinate grid for your class, then print it or paste it into a worksheet.</p>
  </header>

  <div class="layout">
    <div class="controls">
      <section class="card">
        <h2>Grid</h2>
        <div class="chips" role="group" aria-label="Layout">
          {#each LAYOUTS as [value, label]}
            <button class="chip" class:on={settings.layout === value} onclick={() => (settings.layout = value)}>{label}</button>
          {/each}
        </div>

        <div class="axes">
          <span></span>
          <span class="axis-head">x-axis <small>(across)</small></span>
          <span class="axis-head">y-axis <small>(up)</small></span>

          <label for="xBlocks">Blocks</label>
          <input id="xBlocks" type="number" min="1" max={MAX_BLOCKS} bind:value={settings.xBlocks} />
          <input aria-label="y-axis blocks" type="number" min="1" max={MAX_BLOCKS} bind:value={settings.yBlocks} />

          <label for="xStep">Count by</label>
          <input id="xStep" type="number" min="0" step="any" bind:value={settings.xStep} />
          <input aria-label="y-axis count by" type="number" min="0" step="any" bind:value={settings.yStep} />

          {#if settings.layout === 'custom'}
            <label for="xStart">Starts at</label>
            <input id="xStart" type="number" step="any" bind:value={settings.xStart} />
            <input aria-label="y-axis starts at" type="number" step="any" bind:value={settings.yStart} />
          {/if}

          <label for="xEvery">Numbers</label>
          <select id="xEvery" bind:value={settings.xEvery}>
            {#each EVERY_OPTIONS as [v, label]}<option value={v}>{label}</option>{/each}
          </select>
          <select aria-label="y-axis numbers" bind:value={settings.yEvery}>
            {#each EVERY_OPTIONS as [v, label]}<option value={v}>{label}</option>{/each}
          </select>

          <span></span>
          <span class="range">{range('x')}</span>
          <span class="range">{range('y')}</span>
        </div>

        <label class="check"><input type="checkbox" bind:checked={settings.arrows} /> Arrows on the axes</label>
        <label class="check"><input type="checkbox" bind:checked={settings.light} /> Light gray grid lines</label>
      </section>

      <section class="card">
        <h2>Title &amp; labels</h2>
        <label class="field">Title <input type="text" placeholder="(none)" bind:value={settings.title} /></label>
        <div class="two">
          <label class="field">x-axis label <input type="text" placeholder="(none)" bind:value={settings.xLabel} /></label>
          <label class="field">y-axis label <input type="text" placeholder="(none)" bind:value={settings.yLabel} /></label>
        </div>
        <p class="hint">A short label like <i>x</i> goes at the arrow; a longer one like “Time (hours)” runs along the side.</p>
        <label class="check">
          <input type="checkbox" bind:checked={settings.blanks} />
          Leave blank lines for students to write any empty title or label
        </label>
      </section>

      <section class="card">
        <h2>Data <small>(optional)</small></h2>
        <label class="field">
          Points
          <textarea rows="2" placeholder="(1, 2)  (3, 5)  (6, 4)" bind:value={settings.points}></textarea>
        </label>
        {#if pointCount}
          <p class="hint">{pointCount} point{pointCount === 1 ? '' : 's'}</p>
          <div class="chips" role="group" aria-label="Point style">
            {#each STYLES as [value, label]}
              <button class="chip" class:on={settings.style === value} onclick={() => (settings.style = value)}>{label}</button>
            {/each}
          </div>
        {/if}
        <label class="check"><input type="checkbox" bind:checked={settings.lineOn} /> Draw the line</label>
        {#if settings.lineOn}
          <div class="equation">
            <i>y</i> =
            <input aria-label="slope m" type="number" step="any" bind:value={settings.m} />
            <i>x</i> +
            <input aria-label="intercept b" type="number" step="any" bind:value={settings.b} />
          </div>
        {/if}
      </section>

      <button class="btn-ghost reset" onclick={reset}>Start over</button>
    </div>

    <div class="preview">
      <div class="card sheet">
        <Graph settings={clean} bind:svg />
      </div>
      <div class="actions">
        <button class="btn-primary" onclick={() => window.print()}>Print</button>
        <label class="copies">
          <select bind:value={settings.copies}>
            <option value={1}>1 per page</option>
            <option value={2}>2 per page</option>
            <option value={4}>4 per page</option>
          </select>
        </label>
        <button class="btn-ghost" onclick={copyImage}>Copy image</button>
        <button class="btn-ghost" onclick={() => downloadPng(svg, `${filename}.png`)}>Download PNG</button>
        <button class="btn-ghost" onclick={() => downloadSvg(svg, `${filename}.svg`)}>Download SVG</button>
        <button class="btn-ghost" onclick={copyLink}>Copy link</button>
      </div>
      <p class="status" aria-live="polite">{status}</p>
    </div>
  </div>
</div>

<!-- What actually prints: just the graph(s), sized to the page. -->
<div class="print-sheet copies-{clean.copies}">
  {#each Array.from({ length: clean.copies }) as _, i}
    <div class="print-cell"><Graph settings={clean} id="p{i}" /></div>
  {/each}
</div>

<style>
  .page { max-width: 76rem; margin: 0 auto; padding: 1.5rem 1.25rem 1rem; }
  .intro { margin-bottom: 1.25rem; }
  .title-row { display: flex; align-items: center; gap: 0.75rem; }
  h1 { font-size: 1.8rem; font-weight: 800; }
  .intro p { margin: 0.4rem 0 0; color: var(--muted); }

  .layout { display: grid; grid-template-columns: minmax(0, 25rem) minmax(0, 1fr); gap: 1.5rem; align-items: start; }
  @media (max-width: 860px) { .layout { grid-template-columns: minmax(0, 1fr); } }

  .card { padding: 1.1rem 1.25rem; }
  .controls { display: flex; flex-direction: column; gap: 1rem; }
  h2 { font-size: 1.1rem; font-weight: 800; margin-bottom: 0.75rem; }
  h2 small { font-weight: 500; color: var(--muted); font-size: 0.85rem; }

  input[type='number'], input[type='text'], select, textarea {
    width: 100%;
    padding: 0.5rem 0.6rem;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font: inherit;
    font-size: 0.95rem;
    background: #fff;
    color: var(--ink);
  }
  input:focus, select:focus, textarea:focus { outline: none; border-color: var(--blue); }
  textarea { resize: vertical; font-family: ui-monospace, Menlo, monospace; }

  .axes {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.5rem 0.6rem;
    align-items: center;
    margin: 1rem 0 0.75rem;
  }
  .axes label { font-weight: 600; font-size: 0.92rem; }
  .axis-head { font-weight: 800; font-size: 0.95rem; }
  .axis-head small { font-weight: 500; color: var(--muted); }
  .range { font-size: 0.82rem; color: var(--muted); }

  .check { display: flex; gap: 0.5rem; align-items: flex-start; margin-top: 0.55rem; font-size: 0.95rem; cursor: pointer; }
  .check input { margin-top: 0.2rem; accent-color: var(--blue); width: 1rem; height: 1rem; flex: none; }
  .field { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.92rem; margin-bottom: 0.65rem; }
  .field input, .field textarea { font-weight: 400; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
  .hint { margin: -0.2rem 0 0.5rem; font-size: 0.85rem; color: var(--muted); }
  .equation { display: flex; align-items: center; gap: 0.45rem; margin-top: 0.6rem; font-size: 1.1rem; font-family: 'Times New Roman', serif; }
  .equation input { width: 5.5rem; font-family: system-ui, sans-serif; }
  .reset { align-self: flex-start; }

  .preview { position: sticky; top: 1rem; }
  @media (max-width: 860px) { .preview { position: static; } }
  .sheet { padding: 1rem; display: flex; justify-content: center; }
  .sheet :global(svg) { max-height: 78vh; width: auto; max-width: 100%; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; align-items: center; }
  .copies select { width: auto; padding: 0.62rem 0.6rem; }
  .status { min-height: 1.4rem; margin: 0.6rem 0 0; color: var(--green); font-weight: 600; font-size: 0.92rem; }

  .print-sheet { display: none; }
  @media print {
    @page { size: letter portrait; margin: 0.5in; }
    .print-sheet { display: grid; gap: 0.3in; width: 7.5in; }
    .print-cell { display: flex; justify-content: center; align-items: center; break-inside: avoid; }
    .print-cell :global(svg) { width: 100%; height: 100%; }
    .copies-1 .print-cell { height: 9.8in; }
    .copies-2 .print-cell { height: 4.75in; }
    .copies-4 { grid-template-columns: 1fr 1fr; }
    .copies-4 .print-cell { height: 4.75in; }
  }
</style>
