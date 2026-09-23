<script>
  // The whole tool: presets and collapsed settings on the left, the graph and
  // an icon toolbar on the right. On a wide screen the page itself never
  // scrolls; only the settings column does. Settings are mirrored into the
  // page address so a bookmark brings back exactly this graph, and every
  // change can be undone.
  import {
    Copy, FileDown, Heading, ImageDown, Link, MoveRight, MoveUp, Redo2, Undo2,
  } from '@lucide/svelte'
  import CapPicker from './CapPicker.svelte'
  import Footer from './Footer.svelte'
  import Graph from './Graph.svelte'
  import LabelField from './LabelField.svelte'
  import Presets from './Presets.svelte'
  import Section from './Section.svelte'
  import { copyPng, downloadPng, downloadSvg } from './exporting.js'
  import { CAPS, MAX_BLOCKS, cleanSettings, fmt, settingsFromParams, settingsToQuery } from './settings.js'

  let settings = $state(settingsFromParams(new URLSearchParams(window.location.search)))
  const clean = $derived(cleanSettings(settings))
  const query = $derived(settingsToQuery(clean))

  $effect(() => {
    history.replaceState(null, '', query ? `/?${query}` : '/')
  })

  // Undo/redo. A change is recorded once the settings have been still for a
  // moment, so typing a label is one step rather than one per letter.
  let past = $state.raw([])
  let future = $state.raw([])
  let current = $state.snapshot(clean)
  let currentQuery = query
  let recordTimer
  function record() {
    clearTimeout(recordTimer)
    if (query === currentQuery) return
    past = [...past, current]
    future = []
    current = $state.snapshot(clean)
    currentQuery = query
  }
  $effect(() => {
    query
    clearTimeout(recordTimer)
    recordTimer = setTimeout(record, 500)
  })
  function go(to) {
    current = to
    currentQuery = settingsToQuery(to)
    settings = structuredClone(to)
  }
  function undo() {
    record()
    if (!past.length) return
    future = [...future, current]
    go(past.at(-1))
    past = past.slice(0, -1)
  }
  function redo() {
    record()
    if (!future.length) return
    past = [...past, current]
    go(future.at(-1))
    future = future.slice(0, -1)
  }
  const canUndo = $derived(past.length > 0 || query !== currentQuery)
  const canRedo = $derived(future.length > 0)

  function onkeydown(event) {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return
    // Text boxes keep their own undo while you're typing in them.
    if (event.target.matches?.('input[type=text], input[type=number], textarea')) return
    const key = event.key.toLowerCase()
    if (key === 'z' && !event.shiftKey) undo()
    else if ((key === 'z' && event.shiftKey) || key === 'y') redo()
    else return
    event.preventDefault()
  }

  const EVERY_OPTIONS = [
    [1, 'Every line'],
    [2, 'Every 2nd line'],
    [5, 'Every 5th line'],
    [10, 'Every 10th line'],
    [0, 'No numbers'],
  ]
  // Each axis runs from its start end (left/bottom) to its end end (right/top).
  const AXES = [
    { axis: 'x', title: 'x-axis', icon: MoveRight, ends: [['Start', 'Left end', 'left'], ['End', 'Right end', 'right']] },
    { axis: 'y', title: 'y-axis', icon: MoveUp, ends: [['Start', 'Bottom end', 'down'], ['End', 'Top end', 'up']] },
  ]

  // Named the way Excel and Sheets name them: a chart title and axis titles.
  const TITLES = [
    { key: 'title', name: 'Chart title', placeholder: 'Distance over time' },
    { key: 'xTitle', name: 'x-axis title', placeholder: 'Time (hours)' },
    { key: 'yTitle', name: 'y-axis title', placeholder: 'Distance (km)' },
  ]
  function axisSummary(axis) {
    const blocks = clean[`${axis}Blocks`]
    const step = clean[`${axis}Step`]
    const start = clean[`${axis}Start`]
    const every = clean[`${axis}Every`]
    return [
      `${fmt(start)} to ${fmt(start + blocks * step)}`,
      `by ${fmt(step)}s`,
      every ? (every === 1 ? 'numbered' : `numbered every ${every}`) : 'unnumbered',
      clean[`${axis}LabelMode`] === 'text' && clean[`${axis}Label`].trim() ? `“${clean[`${axis}Label`].trim()}”` : 'no label',
      endsSummary(clean[`${axis}StartCap`], clean[`${axis}EndCap`]),
    ].join(' · ')
  }
  function endsSummary(start, end) {
    if (start === end) return start === 'none' ? 'plain ends' : `${CAPS[start].toLowerCase()}s`
    return `${CAPS[start].toLowerCase()} / ${CAPS[end].toLowerCase()}`
  }
  const titlesSummary = $derived.by(() => {
    const shown = (key) => (clean[`${key}Mode`] === 'text' ? clean[key].trim() : '')
    const parts = TITLES.map(({ key, name }) =>
      clean[`${key}Mode`] === 'blank' ? `${name}: blank line` : shown(key) ? `“${shown(key)}”` : '',
    )
    return parts.filter(Boolean).join(' · ') || 'None'
  })

  function applyPreset(preset) {
    settings = $state.snapshot(preset)
  }

  let svg = $state()
  let status = $state('')
  let statusTimer
  function flash(msg) {
    status = msg
    clearTimeout(statusTimer)
    statusTimer = setTimeout(() => (status = ''), 2200)
  }
  const filename = $derived(
    (clean.titleMode === 'text' && clean.title.trim() ? clean.title.trim() : 'graph')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'graph',
  )

  async function copyImage() {
    try {
      await copyPng(svg)
      flash('Image copied. Paste it into your document.')
    } catch {
      flash('Your browser blocked copying. Try downloading a PNG instead.')
    }
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      flash('Link copied. It opens this exact graph.')
    } catch {
      flash('Copy the address bar to share this graph.')
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="page no-print">
  <header class="intro">
    <div class="title-row">
      <img src="/favicon.svg" alt="" width="40" height="40" />
      <h1>Graph Paper Maker</h1>
    </div>
    <p>Make a coordinate grid for your class, then paste it into a worksheet or download it.</p>
  </header>

  <div class="layout">
    <div class="controls">
      <section class="card">
        <h2 class="card-head">Presets</h2>
        <Presets settings={clean} onapply={applyPreset} />
      </section>

      <section class="card sections">
        <Section title="Titles" icon={Heading} summary={titlesSummary}>
          {#each TITLES as { key, name, placeholder }}
            <div class="field">
              <span>{name}</span>
              <LabelField {name} {placeholder} bind:mode={settings[`${key}Mode`]} bind:text={settings[key]} />
            </div>
          {/each}
        </Section>

        {#each AXES as { axis, title, icon, ends }}
          <Section {title} {icon} summary={axisSummary(axis)}>
            <div class="grid-fields">
              <label>Blocks <input type="number" min="1" max={MAX_BLOCKS} bind:value={settings[`${axis}Blocks`]} /></label>
              <label>Start at <input type="number" step="any" bind:value={settings[`${axis}Start`]} /></label>
              <label>Count by <input type="number" min="0" step="any" bind:value={settings[`${axis}Step`]} /></label>
            </div>
            <label class="field">
              Numbers
              <select bind:value={settings[`${axis}Every`]}>
                {#each EVERY_OPTIONS as [v, label]}<option value={v}>{label}</option>{/each}
              </select>
            </label>
            <div class="field">
              <span>Label <span class="hint">at the {axis === 'x' ? 'right' : 'top'} end</span></span>
              <LabelField
                name="{title} label"
                placeholder={axis}
                blank={false}
                bind:mode={settings[`${axis}LabelMode`]}
                bind:text={settings[`${axis}Label`]}
              />
            </div>
            <div class="ends">
              {#each ends as [key, name, direction]}
                <div class="field">
                  <span>{name}</span>
                  <CapPicker label="{title} {name.toLowerCase()}" {direction} bind:value={settings[`${axis}${key}Cap`]} />
                </div>
              {/each}
            </div>
          </Section>
        {/each}
      </section>
    </div>

    <div class="preview">
      <div class="card canvas">
      <div class="toolbar" role="toolbar" aria-label="Graph actions">
        <button class="icon-btn" aria-label="Copy image" data-tip="Copy image" onclick={copyImage}><Copy size={19} /></button>
        <button class="icon-btn" aria-label="Download PNG" data-tip="Download PNG" onclick={() => downloadPng(svg, `${filename}.png`)}><ImageDown size={19} /></button>
        <button class="icon-btn" aria-label="Download SVG" data-tip="Download SVG" onclick={() => downloadSvg(svg, `${filename}.svg`)}><FileDown size={19} /></button>
        <button class="icon-btn" aria-label="Copy link" data-tip="Copy link" onclick={copyLink}><Link size={19} /></button>
        <span class="divider"></span>
        <button class="icon-btn" aria-label="Undo" data-tip="Undo" disabled={!canUndo} onclick={undo}><Undo2 size={19} /></button>
        <button class="icon-btn" aria-label="Redo" data-tip="Redo" disabled={!canRedo} onclick={redo}><Redo2 size={19} /></button>
      </div>
      <div class="sheet">
        <Graph settings={clean} bind:svg />
        <p class="status" class:shown={status} aria-live="polite">{status}</p>
      </div>
      </div>
      <Footer />
    </div>
  </div>
</div>

<!-- What actually prints: just the graph, sized to the page. -->
<div class="print-sheet">
  <Graph settings={clean} id="p" />
</div>

<style>
  .page { max-width: 76rem; margin: 0 auto; padding: 1.5rem 1.25rem 1rem; }
  .intro { margin-bottom: 1.25rem; }
  .title-row { display: flex; align-items: center; gap: 0.75rem; }
  h1 { font-size: 1.8rem; font-weight: 800; }
  .intro p { margin: 0.4rem 0 0; color: var(--muted); }

  .layout { display: grid; grid-template-columns: minmax(0, 24rem) minmax(0, 1fr); gap: 1.5rem; align-items: start; }
  @media (max-width: 860px) { .layout { grid-template-columns: minmax(0, 1fr); } }

  .controls { display: flex; flex-direction: column; gap: 1rem; }
  /* Cards keep their full height so the column scrolls instead of squashing
     them (the settings card clips its corners, which would let it shrink). */
  .controls > :global(*) { flex-shrink: 0; }

  /* Wide screens: the page fills the window exactly. The settings column
     scrolls on its own; the graph shrinks to fit beside it. */
  @media (min-width: 861px) and (min-height: 560px) {
    .page { height: 100vh; height: 100dvh; display: flex; flex-direction: column; padding-bottom: 0; }
    .layout { flex: 1; min-height: 0; grid-template-rows: minmax(0, 1fr); align-items: stretch; }
    .controls {
      min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin;
      margin: 0 -0.75rem; padding: 0 0.75rem 1.25rem;
    }
    .preview { display: flex; flex-direction: column; min-height: 0; }
    .canvas { flex: 1; min-height: 0; }
    .sheet { flex: 1; min-height: 0; }
    .sheet :global(svg) { width: 100%; height: 100%; }
  }
  .card-head { font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); padding: 1rem 1.1rem 0; }
  .card-head + :global(.presets) { padding-top: 0.6rem; }
  .sections { overflow: hidden; }

  .grid-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; margin-bottom: 0.75rem; }
  .grid-fields label { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.88rem; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .field:last-child { margin-bottom: 0; }
  .field .hint { font-weight: 400; color: var(--muted); }
  .ends { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .ends .field { margin-bottom: 0; }

  .canvas { display: flex; flex-direction: column; }
  .toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 0.3rem; padding: 0.45rem; border-bottom: 1px solid var(--border); }
  .divider { width: 1px; height: 1.6rem; background: var(--border); margin: 0 0.3rem; }
  @media (max-width: 480px) {
    .divider { display: none; }
    .toolbar { justify-content: space-between; gap: 0.15rem; padding: 0.35rem; }
    .toolbar :global(.icon-btn) { width: 2.15rem; height: 2.15rem; }
  }
  .sheet { position: relative; padding: 1rem; display: flex; justify-content: center; }
  .status {
    position: absolute; left: 50%; bottom: 0.9rem; transform: translate(-50%, 0.4rem);
    max-width: calc(100% - 2rem); margin: 0; padding: 0.45rem 0.85rem; border-radius: 999px;
    background: var(--ink); color: #fff; font-weight: 600; font-size: 0.86rem; text-align: center;
    opacity: 0; pointer-events: none; transition: opacity 0.15s, transform 0.15s;
  }
  .status.shown { opacity: 1; transform: translate(-50%, 0); }
  .sheet :global(svg) { max-height: 74vh; width: auto; max-width: 100%; }
  .preview :global(footer) { padding: 1rem 0 1.25rem; }

  .print-sheet { display: none; }
  @media print {
    @page { size: letter portrait; margin: 0.5in; }
    .print-sheet { display: block; width: 7.5in; height: 9.8in; break-inside: avoid; }
    .print-sheet :global(svg) { width: 100%; height: 100%; }
  }
</style>
