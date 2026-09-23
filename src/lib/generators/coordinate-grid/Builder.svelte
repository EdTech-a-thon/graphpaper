<script>
  // The Coordinate Grid Generator: presets and collapsed settings on the left,
  // the figure card on the right. On a wide screen the page itself never
  // scrolls; only the settings column does. Settings are mirrored into the
  // page address so a bookmark or shared link brings back exactly this grid,
  // and the server renders that same grid on first load.
  import { Heading, MoveRight, MoveUp } from '@lucide/svelte'
  import { replaceState } from '$app/navigation'
  import { page } from '$app/state'
  import Footer from '$lib/site/Footer.svelte'
  import CapPicker from '$lib/shared/CapPicker.svelte'
  import FigureCanvas from '$lib/shared/FigureCanvas.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import Presets from '$lib/shared/Presets.svelte'
  import Section from '$lib/shared/Section.svelte'
  import { createHistory } from '$lib/shared/history.svelte.js'
  import Graph from './Graph.svelte'
  import { BUILT_IN_PRESETS, presetStore } from './presets.js'
  import { CAPS, MAX_BLOCKS, cleanSettings, fmt, sameGraph, settingsFromParams, settingsToQuery } from './settings.js'

  let settings = $state(settingsFromParams(page.url.searchParams))
  const clean = $derived(cleanSettings(settings))
  const query = $derived(settingsToQuery(clean))

  $effect(() => {
    const url = query ? `${page.url.pathname}?${query}` : page.url.pathname
    if (url !== `${location.pathname}${location.search}`) replaceState(url, page.state)
  })

  const history = createHistory({
    read: () => $state.snapshot(clean),
    write: (snap) => (settings = snap),
    keyOf: settingsToQuery,
  })

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
  const filename = $derived(
    (clean.titleMode === 'text' && clean.title.trim() ? clean.title.trim() : 'graph')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'graph',
  )

</script>

<div class="page no-print">
  <h1 class="visually-hidden">Coordinate Grid Generator</h1>
  <div class="layout">
    <div class="controls">
      <section class="card">
        <h2 class="card-head">Presets</h2>
        <Presets builtIns={BUILT_IN_PRESETS} store={presetStore} same={sameGraph} settings={clean} onapply={applyPreset} />
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
                  <CapPicker options={CAPS} label="{title} {name.toLowerCase()}" {direction} bind:value={settings[`${axis}${key}Cap`]} />
                </div>
              {/each}
            </div>
          </Section>
        {/each}
      </section>
    </div>

    <div class="preview">
      <FigureCanvas {svg} {filename} {history}>
        <Graph settings={clean} bind:svg />
      </FigureCanvas>
      <Footer />
    </div>
  </div>
</div>

<!-- What actually prints: just the graph, sized to the page. -->
<div class="print-sheet">
  <Graph settings={clean} id="p" />
</div>

<style>
  .page { max-width: 76rem; margin: 0 auto; padding: 1.25rem 1.25rem 1rem; }

  .layout { display: grid; grid-template-columns: minmax(0, 24rem) minmax(0, 1fr); gap: 1.5rem; align-items: start; }
  @media (max-width: 860px) { .layout { grid-template-columns: minmax(0, 1fr); } }

  .controls { display: flex; flex-direction: column; gap: 1rem; }
  /* Cards keep their full height so the column scrolls instead of squashing
     them (the settings card clips its corners, which would let it shrink). */
  .controls > :global(*) { flex-shrink: 0; }

  /* Wide screens: the page fills the window exactly. The settings column
     scrolls on its own; the graph shrinks to fit beside it. */
  @media (min-width: 861px) and (min-height: 560px) {
    .page { height: calc(100dvh - var(--topbar-h)); display: flex; flex-direction: column; padding-bottom: 0; }
    .layout { flex: 1; min-height: 0; grid-template-rows: minmax(0, 1fr); align-items: stretch; }
    .controls {
      min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin;
      margin: 0 -0.75rem; padding: 0 0.75rem 1.25rem;
    }
    .preview { display: flex; flex-direction: column; min-height: 0; }
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

  .preview :global(footer) { padding: 1rem 0 1.25rem; }

  .print-sheet { display: none; }
  @media print {
    @page { size: letter portrait; margin: 0.5in; }
    .print-sheet { display: block; width: 7.5in; height: 9.8in; break-inside: avoid; }
    .print-sheet :global(svg) { width: 100%; height: 100%; }
  }
</style>
