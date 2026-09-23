<script>
  // The Coordinate Grid Generator: presets and collapsed settings on the left,
  // the figure card on the right. On a wide screen the page itself never
  // scrolls; only the settings column does. Settings are mirrored into the
  // page address so a bookmark or shared link brings back exactly this grid,
  // and the server renders that same grid on first load.
  import { Heading, MoveRight, MoveUp } from '@lucide/svelte'
  import { afterNavigate, replaceState } from '$app/navigation'
  import { page } from '$app/state'
  import CapPicker from '$lib/shared/CapPicker.svelte'
  import FigureCanvas from '$lib/shared/FigureCanvas.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import MathInput from '$lib/shared/MathInput.svelte'
  import { NUMBERINGS, niceText } from '$lib/shared/numbering.js'
  import Presets from '$lib/shared/Presets.svelte'
  import Section from '$lib/shared/Section.svelte'
  import { createHistory } from '$lib/shared/history.svelte.js'
  import Graph from './Graph.svelte'
  import { BUILT_IN_PRESETS, presetStore } from './presets.js'
  import { CAPS, cleanSettings, readAxes, sameGraph, settingsFromParams, settingsToQuery } from './settings.js'

  let settings = $state(settingsFromParams(page.url.searchParams))
  const clean = $derived(cleanSettings(settings))
  const query = $derived(settingsToQuery(clean))
  const axes = $derived(readAxes(clean))

  // The router can't replace the address until the page has hydrated, which
  // matters when a link arrives written differently from how we'd write it.
  let routerReady = $state(false)
  afterNavigate(() => (routerReady = true))
  $effect(() => {
    const url = query ? `${page.url.pathname}?${query}` : page.url.pathname
    if (routerReady && url !== `${location.pathname}${location.search}`) replaceState(url, page.state)
  })

  const history = createHistory({
    read: () => $state.snapshot(clean),
    write: (snap) => (settings = snap),
    keyOf: settingsToQuery,
    tidy: cleanSettings,
    storageKey: 'mathfigures.coordinate-grid.history',
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
    { axis: 'x', heading: 'x-axis', icon: MoveRight, ends: [['Start', 'Left end', 'left'], ['End', 'Right end', 'right']] },
    { axis: 'y', heading: 'y-axis', icon: MoveUp, ends: [['Start', 'Bottom end', 'down'], ['End', 'Top end', 'up']] },
  ]

  // Named the way Excel and Sheets name them: a chart title and axis titles.
  const TITLES = [
    { key: 'title', name: 'Chart title', placeholder: 'Distance over time' },
    { key: 'xTitle', name: 'x-axis title', placeholder: 'Time (hours)' },
    { key: 'yTitle', name: 'y-axis title', placeholder: 'Distance (km)' },
  ]
  const RANGE_FIELDS = [
    ['From', 'From'],
    ['To', 'To'],
    ['Step', 'Count by'],
  ]
  function axisSummary(axis) {
    const { start, step, blocks } = axes[axis]
    const every = clean[`${axis}Every`]
    const n = (v) => niceText(v, clean[`${axis}Numbering`])
    return [
      `${n(start)} to ${n(start + blocks * step)}`,
      `by ${n(step)}`,
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
    (clean.titleMode === 'text' && clean.title.trim() ? clean.title.trim() : 'coordinate-grid')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'coordinate-grid',
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

        {#each AXES as { axis, heading, icon, ends }}
          <Section title={heading} {icon} summary={axisSummary(axis)}>
            <div class="grid-fields">
              {#each RANGE_FIELDS as [key, name]}
                <div class="range-field">
                  <label for="{axis}-{key}">{name}</label>
                  <MathInput id="{axis}-{key}" aria-invalid={!!axes.problems[`${axis}${key}`]} bind:value={settings[`${axis}${key}`]} />
                </div>
              {/each}
            </div>
            {#each RANGE_FIELDS as [key]}
              {#if axes.problems[`${axis}${key}`]}<p class="help problem">{axes.problems[`${axis}${key}`]}</p>{/if}
            {/each}
            <div class="pair">
              <label class="field">
                Numbers
                <select bind:value={settings[`${axis}Every`]}>
                  {#each EVERY_OPTIONS as [v, label]}<option value={v}>{label}</option>{/each}
                </select>
              </label>
              <label class="field">
                Write numbers as
                <select bind:value={settings[`${axis}Numbering`]}>
                  {#each Object.entries(NUMBERINGS) as [v, label]}<option value={v}>{label}</option>{/each}
                </select>
              </label>
            </div>
            <div class="field">
              <span>Label <span class="hint">at the {axis === 'x' ? 'right' : 'top'} end</span></span>
              <LabelField
                name="{heading} label"
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
                  <CapPicker options={CAPS} label="{heading} {name.toLowerCase()}" {direction} bind:value={settings[`${axis}${key}Cap`]} />
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
    </div>
  </div>
</div>

<!-- What actually prints: just the graph, sized to the page. -->
<div class="print-sheet">
  <Graph settings={clean} id="p" />
</div>

<style>
  .page { padding: 1.25rem 1.25rem 1rem; }

  .layout { display: grid; grid-template-columns: minmax(0, 24rem) minmax(0, 1fr); gap: 1.5rem; align-items: start; }
  @media (max-width: 860px) { .layout { grid-template-columns: minmax(0, 1fr); } }

  .controls { display: flex; flex-direction: column; gap: 1rem; }
  /* Cards keep their full height so the column scrolls instead of squashing
     them (the settings card clips its corners, which would let it shrink). */
  .controls > :global(*) { flex-shrink: 0; }

  /* Wide screens: the page fills the window exactly. The settings column
     scrolls on its own; the graph shrinks to fit beside it. */
  @media (min-width: 861px) and (min-height: 560px) {
    .page { height: calc(100dvh - var(--topbar-h)); display: flex; flex-direction: column; }
    .layout { flex: 1; min-height: 0; grid-template-rows: minmax(0, 1fr); align-items: stretch; }
    .controls {
      min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin;
      margin: 0 -0.75rem -1rem; padding: 0 0.75rem 1.25rem;
    }
    .preview { display: flex; flex-direction: column; min-height: 0; }
  }
  .card-head { font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); padding: 1rem 1.1rem 0; }
  .card-head + :global(.presets) { padding-top: 0.6rem; }
  .sections { overflow: hidden; }

  .grid-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; margin-bottom: 0.75rem; }
  .range-field { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.88rem; min-width: 0; }
  .grid-fields ~ .help { margin: -0.3rem 0 0.75rem; font-size: 0.84rem; }
  .help.problem { color: var(--red); font-weight: 600; }
  .pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .field:last-child { margin-bottom: 0; }
  .field .hint { font-weight: 400; color: var(--muted); }
  .ends { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .ends .field { margin-bottom: 0; }


  .print-sheet { display: none; }
  @media print {
    @page { size: letter portrait; margin: 0.5in; }
    .print-sheet { display: block; width: 7.5in; height: 9.8in; break-inside: avoid; }
    .print-sheet :global(svg) { width: 100%; height: 100%; }
  }
</style>
