<script>
  // The whole tool: presets and collapsed settings on the left, the graph and
  // an icon toolbar on the right. Settings are mirrored into the page address
  // so a bookmark brings back exactly this graph.
  import {
    Copy, FileCode, Heading, ImageDown, Link, MoveRight, MoveUp, Palette, Printer, RotateCcw,
  } from '@lucide/svelte'
  import Graph from './Graph.svelte'
  import LabelField from './LabelField.svelte'
  import Presets from './Presets.svelte'
  import Section from './Section.svelte'
  import { copyPng, downloadPng, downloadSvg } from './exporting.js'
  import { DEFAULT_SETTINGS, MAX_BLOCKS, cleanSettings, fmt, settingsFromParams, settingsToQuery } from './settings.js'

  let settings = $state(settingsFromParams(new URLSearchParams(window.location.search)))
  const clean = $derived(cleanSettings(settings))
  const query = $derived(settingsToQuery(clean))

  $effect(() => {
    history.replaceState(null, '', query ? `/?${query}` : '/')
  })

  const EVERY_OPTIONS = [
    [1, 'Every line'],
    [2, 'Every 2nd line'],
    [5, 'Every 5th line'],
    [10, 'Every 10th line'],
    [0, 'No numbers'],
  ]
  const AXES = [
    { axis: 'x', title: 'x-axis', icon: MoveRight },
    { axis: 'y', title: 'y-axis', icon: MoveUp },
  ]

  function labelSummary(mode, text) {
    if (mode === 'blank') return 'blank line'
    if (mode === 'none' || !text.trim()) return 'no label'
    return `“${text.trim()}”`
  }
  function axisSummary(axis) {
    const blocks = clean[`${axis}Blocks`]
    const step = clean[`${axis}Step`]
    const start = clean[`${axis}Start`]
    const every = clean[`${axis}Every`]
    return [
      `${fmt(start)} to ${fmt(start + blocks * step)}`,
      `by ${fmt(step)}s`,
      every ? (every === 1 ? 'numbered' : `numbered every ${every}`) : 'unnumbered',
      labelSummary(clean[`${axis}LabelMode`], clean[`${axis}Label`]),
    ].join(' · ')
  }
  const titleSummary = $derived(
    clean.titleMode === 'blank' ? 'Blank line for students' : clean.titleMode === 'text' && clean.title.trim() ? `“${clean.title.trim()}”` : 'None',
  )
  const styleSummary = $derived(`${clean.arrows ? 'Arrows' : 'No arrows'} · ${clean.light ? 'light gray' : 'black'} grid lines`)

  function applyPreset(preset) {
    settings = { ...$state.snapshot(preset), copies: settings.copies }
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
  function reset() {
    settings = structuredClone(DEFAULT_SETTINGS)
    flash('Back to the default graph.')
  }
</script>

<div class="page no-print">
  <header class="intro">
    <div class="title-row">
      <img src="/favicon.svg" alt="" width="40" height="40" />
      <h1>Graph Paper Maker</h1>
    </div>
    <p>Make a coordinate grid for your class, then print it or paste it into a worksheet.</p>
  </header>

  <div class="layout">
    <div class="controls">
      <section class="card">
        <h2 class="card-head">Presets</h2>
        <Presets settings={clean} onapply={applyPreset} />
      </section>

      <section class="card sections">
        {#each AXES as { axis, title, icon }}
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
              <span>Label</span>
              <LabelField
                name="{title} label"
                placeholder={axis === 'x' ? 'x or Time (hours)' : 'y or Distance (km)'}
                bind:mode={settings[`${axis}LabelMode`]}
                bind:text={settings[`${axis}Label`]}
              />
            </div>
          </Section>
        {/each}

        <Section title="Title" icon={Heading} summary={titleSummary}>
          <LabelField name="Title" placeholder="Graph title" bind:mode={settings.titleMode} bind:text={settings.title} />
        </Section>

        <Section title="Style" icon={Palette} summary={styleSummary}>
          <label class="check"><input type="checkbox" bind:checked={settings.arrows} /> Arrows on the axes</label>
          <label class="check"><input type="checkbox" bind:checked={settings.light} /> Light gray grid lines</label>
        </Section>
      </section>
    </div>

    <div class="preview">
      <div class="toolbar card" role="toolbar" aria-label="Graph actions">
        <button class="icon-btn primary" aria-label="Print" data-tip="Print" onclick={() => window.print()}><Printer size={19} /></button>
        <div class="per-page" role="radiogroup" aria-label="Graphs per printed page" data-tip="Graphs per page">
          {#each [1, 2, 4] as n}
            <button role="radio" aria-checked={settings.copies === n} class:on={settings.copies === n} onclick={() => (settings.copies = n)}>{n}</button>
          {/each}
          <span class="per-page-label">per page</span>
        </div>
        <span class="divider"></span>
        <button class="icon-btn" aria-label="Copy image" data-tip="Copy image" onclick={copyImage}><Copy size={19} /></button>
        <button class="icon-btn" aria-label="Download PNG" data-tip="Download PNG" onclick={() => downloadPng(svg, `${filename}.png`)}><ImageDown size={19} /></button>
        <button class="icon-btn" aria-label="Download SVG" data-tip="Download SVG" onclick={() => downloadSvg(svg, `${filename}.svg`)}><FileCode size={19} /></button>
        <button class="icon-btn" aria-label="Copy link" data-tip="Copy link" onclick={copyLink}><Link size={19} /></button>
        <span class="divider"></span>
        <button class="icon-btn" aria-label="Start over" data-tip="Start over" onclick={reset}><RotateCcw size={19} /></button>
      </div>
      <p class="status" aria-live="polite">{status}</p>
      <div class="card sheet">
        <Graph settings={clean} bind:svg />
      </div>
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

  .layout { display: grid; grid-template-columns: minmax(0, 24rem) minmax(0, 1fr); gap: 1.5rem; align-items: start; }
  @media (max-width: 860px) { .layout { grid-template-columns: minmax(0, 1fr); } }

  .controls { display: flex; flex-direction: column; gap: 1rem; }
  .card-head { font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); padding: 1rem 1.1rem 0; }
  .card-head + :global(.presets) { padding-top: 0.6rem; }
  .sections { overflow: hidden; }

  .grid-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; margin-bottom: 0.75rem; }
  .grid-fields label { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.88rem; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .field:last-child { margin-bottom: 0; }
  .check { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.4rem; font-size: 0.95rem; cursor: pointer; }
  .check input { accent-color: var(--blue); width: 1rem; height: 1rem; }

  .preview { position: sticky; top: 1rem; }
  @media (max-width: 860px) { .preview { position: static; } }
  .toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 0.3rem; padding: 0.45rem; }
  .divider { width: 1px; height: 1.6rem; background: var(--border); margin: 0 0.3rem; }
  .per-page { position: relative; display: inline-flex; align-items: center; gap: 2px; padding: 3px; border-radius: 10px; background: var(--bg); }
  .per-page button {
    width: 1.9rem; height: 1.9rem; border: 0; border-radius: 8px; background: transparent;
    color: var(--muted); font-weight: 700; font-size: 0.9rem;
  }
  .per-page button.on { background: #fff; color: var(--blue-dark); box-shadow: 0 1px 2px rgba(16, 24, 40, 0.12); }
  .per-page-label { padding: 0 0.45rem 0 0.25rem; font-size: 0.82rem; color: var(--muted); }
  @media (max-width: 480px) {
    .per-page-label, .divider { display: none; }
    .toolbar { justify-content: space-between; }
    .toolbar { gap: 0.15rem; padding: 0.35rem; }
    .toolbar :global(.icon-btn) { width: 2.15rem; height: 2.15rem; }
    .per-page button { width: 1.7rem; height: 1.7rem; }
  }
  .status { min-height: 1.3rem; margin: 0.45rem 0.25rem; color: var(--green); font-weight: 600; font-size: 0.88rem; }
  .sheet { padding: 1rem; display: flex; justify-content: center; }
  .sheet :global(svg) { max-height: 74vh; width: auto; max-width: 100%; }

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
