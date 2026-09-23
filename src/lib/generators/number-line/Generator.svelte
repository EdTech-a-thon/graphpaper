<script>
  // The Number Line Generator: presets, the inequality and the line's settings
  // on the left, the figure card on the right. Settings are mirrored into the page
  // address so a bookmark or shared link brings back exactly this number line,
  // and the server renders that same line on first load.
  import { CircleHelp, Ruler } from '@lucide/svelte'
  import { afterNavigate, replaceState } from '$app/navigation'
  import { page } from '$app/state'
  import FigureCanvas from '$lib/shared/FigureCanvas.svelte'
  import MathInput from '$lib/shared/MathInput.svelte'
  import Presets from '$lib/shared/Presets.svelte'
  import Section from '$lib/shared/Section.svelte'
  import { createHistory } from '$lib/shared/history.svelte.js'
  import { niceText } from '$lib/shared/numbering.js'
  import NumberLine from './NumberLine.svelte'
  import { presetStore } from './presets.js'
  import { cleanSettings, readLine, sameFigure, settingsFromParams, settingsToQuery } from './settings.js'

  let settings = $state(settingsFromParams(page.url.searchParams))
  const clean = $derived(cleanSettings(settings))
  const query = $derived(settingsToQuery(clean))
  const line = $derived(readLine(clean))

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
    storageKey: 'mathfigures.number-line.history',
  })

  const EVERY_OPTIONS = [
    [1, 'Every tick'],
    [2, 'Every 2nd tick'],
    [4, 'Every 4th tick'],
    [5, 'Every 5th tick'],
    [10, 'Every 10th tick'],
    [0, 'No numbers'],
  ]
  const RANGE_FIELDS = [
    ['from', 'From'],
    ['to', 'To'],
    ['step', 'Count by'],
  ]

  const lineSummary = $derived.by(() => {
    const { from, to, step } = line.range
    const n = (v) => niceText(v, line.numbering)
    return [
      `${n(from)} to ${n(to)}`,
      `by ${n(step)}`,
      clean.every ? (clean.every === 1 ? 'numbered' : `numbered every ${clean.every}`) : 'unnumbered',
    ].join(' · ')
  })

  function applyPreset(preset) {
    settings = $state.snapshot(preset)
  }

  let svg = $state()
  const filename = 'number-line'
</script>

<div class="page no-print">
  <h1 class="visually-hidden">Number Line Generator</h1>
  <div class="layout">
    <div class="controls">
      <section class="card">
        <h2 class="card-head">Presets</h2>
        <Presets store={presetStore} same={sameFigure} settings={clean} onapply={applyPreset} />
      </section>

      <section class="card inequality">
        <div class="field">
          <div class="head-row">
            <label class="card-head flush" for="inequality">Equation</label>
            <span class="tip">
              <button type="button" class="tip-btn" aria-label="How to type an equation" aria-describedby="equation-tip">
                <CircleHelp size={17} aria-hidden="true" />
              </button>
              <span id="equation-tip" role="tooltip" class="tip-text">
                Try x &lt; −1 or x ≥ 3, x ≠ 2, all real numbers or no solution. Type &lt;= for ≤, != for ≠, pi for π and / for a
                fraction. Leave it empty for a blank line.
              </span>
            </span>
          </div>
          <MathInput
            kind="inequality"
            id="inequality"
            placeholder="−2 < x ≤ 5"
            aria-invalid={!!line.problems.inequality}
            aria-describedby={line.problems.inequality ? 'equation-problem' : undefined}
            bind:value={settings.inequality}
          />
        </div>
        {#if line.problems.inequality}<p id="equation-problem" class="help problem">{line.problems.inequality}</p>{/if}
      </section>

      <section class="card sections">
        <Section title="Line" icon={Ruler} summary={lineSummary}>
          <div class="range-fields">
            {#each RANGE_FIELDS as [key, name]}
              <div class="range-field">
                <label for="range-{key}">{name}</label>
                <MathInput id="range-{key}" aria-invalid={!!line.problems[key]} bind:value={settings[key]} />
              </div>
            {/each}
          </div>
          {#each RANGE_FIELDS as [key]}
            {#if line.problems[key]}<p class="help problem">{line.problems[key]}</p>{/if}
          {/each}
          <label class="field">
            Numbers
            <select bind:value={settings.every}>
              {#each EVERY_OPTIONS as [v, label]}<option value={v}>{label}</option>{/each}
            </select>
          </label>
        </Section>
      </section>
    </div>

    <div class="preview">
      <FigureCanvas {svg} {filename} {history}>
        <NumberLine settings={clean} bind:svg />
      </FigureCanvas>
    </div>
  </div>
</div>

<!-- What actually prints: just the number line, across the page. -->
<div class="print-sheet">
  <NumberLine settings={clean} id="p" />
</div>

<style>
  .page { padding: 1.25rem 1.25rem 1rem; }

  .layout { display: grid; grid-template-columns: minmax(0, 24rem) minmax(0, 1fr); gap: 1.5rem; align-items: start; }
  @media (max-width: 860px) { .layout { grid-template-columns: minmax(0, 1fr); } }

  .controls { display: flex; flex-direction: column; gap: 1rem; }
  .controls > :global(*) { flex-shrink: 0; }

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
  .card-head.flush { padding: 0; }
  .sections { overflow: hidden; }

  .inequality { padding: 1rem 1.1rem; }
  .inequality .field { margin-bottom: 0; }
  .head-row { display: flex; align-items: center; justify-content: space-between; }
  .tip { position: relative; display: inline-flex; }
  .tip-btn { display: inline-grid; place-items: center; width: 1.7rem; height: 1.7rem; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--muted); cursor: help; }
  .tip-btn:hover, .tip-btn:focus-visible { color: var(--blue-dark); background: var(--blue-soft); }
  .tip-text {
    position: absolute; top: calc(100% + 6px); right: 0; z-index: 20; width: min(17rem, 80vw);
    padding: 0.55rem 0.7rem; border-radius: 8px; background: var(--ink); color: #fff;
    font-size: 0.8rem; font-weight: 500; line-height: 1.4; pointer-events: none;
    visibility: hidden; opacity: 0; transition: opacity 0.12s;
  }
  .tip:hover .tip-text, .tip-btn:focus-visible + .tip-text { visibility: visible; opacity: 1; }
  .help { margin: 0.45rem 0 0; font-size: 0.84rem; color: var(--muted); }
  .help.problem { color: var(--red); font-weight: 600; }

  .range-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; }
  .range-field { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.88rem; min-width: 0; }
  .range-fields { margin-bottom: 0.75rem; }
  .range-fields ~ .help { margin: -0.3rem 0 0.75rem; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .field:last-child { margin-bottom: 0; }

  .print-sheet { display: none; }
  @media print {
    @page { size: letter portrait; margin: 0.5in; }
    .print-sheet { display: block; width: 7.5in; break-inside: avoid; }
    .print-sheet :global(svg) { width: 100%; height: auto; }
  }
</style>
