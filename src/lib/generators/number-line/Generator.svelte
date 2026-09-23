<script>
  // The Number Line Generator: presets, the inequality and collapsed settings on
  // the left, the figure card on the right. Settings are mirrored into the page
  // address so a bookmark or shared link brings back exactly this number line,
  // and the server renders that same line on first load.
  import { Heading, MoveHorizontal, Ruler } from '@lucide/svelte'
  import { afterNavigate, replaceState } from '$app/navigation'
  import { page } from '$app/state'
  import CapPicker from '$lib/shared/CapPicker.svelte'
  import FigureCanvas from '$lib/shared/FigureCanvas.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import MathInput from '$lib/shared/MathInput.svelte'
  import Presets from '$lib/shared/Presets.svelte'
  import Section from '$lib/shared/Section.svelte'
  import { createHistory } from '$lib/shared/history.svelte.js'
  import { NUMBERINGS, niceText } from '$lib/shared/numbering.js'
  import NumberLine from './NumberLine.svelte'
  import { BUILT_IN_PRESETS, presetStore } from './presets.js'
  import { CAPS, cleanSettings, readLine, sameFigure, settingsFromParams, settingsToQuery } from './settings.js'

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
    const n = (v) => niceText(v, clean.numbering)
    return [
      `${n(from)} to ${n(to)}`,
      `by ${n(step)}`,
      clean.every ? (clean.every === 1 ? 'numbered' : `numbered every ${clean.every}`) : 'unnumbered',
      NUMBERINGS[clean.numbering].toLowerCase(),
    ].join(' · ')
  })
  const endsSummary = $derived.by(() => {
    const { startCap: a, endCap: b } = clean
    const caps = a === b ? (a === 'none' ? 'plain ends' : `${CAPS[a].toLowerCase()}s`) : `${CAPS[a].toLowerCase()} / ${CAPS[b].toLowerCase()}`
    const label = clean.labelMode === 'text' ? `“${clean.label.trim() || line.variable || 'x'}”` : 'no label'
    return `${caps} · ${label}`
  })
  const titleSummary = $derived(
    clean.titleMode === 'blank' ? 'Blank line' : clean.titleMode === 'text' && clean.title.trim() ? `“${clean.title.trim()}”` : 'None',
  )

  function applyPreset(preset) {
    settings = { ...$state.snapshot(preset), showGraph: clean.showGraph }
  }

  let svg = $state()
  const filename = $derived(
    (clean.titleMode === 'text' && clean.title.trim() ? clean.title.trim() : 'number-line')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'number-line',
  )
</script>

<div class="page no-print">
  <h1 class="visually-hidden">Number Line Generator</h1>
  <div class="layout">
    <div class="controls">
      <section class="card">
        <h2 class="card-head">Presets</h2>
        <Presets builtIns={BUILT_IN_PRESETS} store={presetStore} same={sameFigure} settings={clean} onapply={applyPreset} />
      </section>

      <section class="card inequality">
        <div class="field">
          <label class="card-head flush" for="inequality">Inequality <span class="hint">leave empty for a blank line</span></label>
          <MathInput
            kind="inequality"
            id="inequality"
            placeholder="−2 < x ≤ 5"
            aria-invalid={!!line.problems.inequality}
            aria-describedby="inequality-help"
            bind:value={settings.inequality}
          />
        </div>
        <p id="inequality-help" class="help" class:problem={line.problems.inequality}>
          {line.problems.inequality ?? 'Try x < −1 or x ≥ 3, x ≠ 2, all real numbers or no solution. Type <= for ≤, != for ≠, pi for π and / for a fraction.'}
        </p>
        <div class="graph-row">
          <label class="check"><input type="checkbox" bind:checked={settings.showGraph} /> Show the graph</label>
          <label class="color">Color <input type="color" bind:value={settings.graphColor} /></label>
        </div>
      </section>

      <section class="card sections">
        <Section title="Title" icon={Heading} summary={titleSummary}>
          <LabelField name="Chart title" placeholder="Graph the solution" bind:mode={settings.titleMode} bind:text={settings.title} />
        </Section>

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
          <label class="field">
            Write numbers as
            <select bind:value={settings.numbering}>
              {#each Object.entries(NUMBERINGS) as [v, label]}<option value={v}>{label}</option>{/each}
            </select>
          </label>
        </Section>

        <Section title="Ends" icon={MoveHorizontal} summary={endsSummary}>
          <div class="field">
            <span>Label <span class="hint">at the right end</span></span>
            <LabelField
              name="Number line label"
              placeholder={line.variable ?? 'x'}
              blank={false}
              bind:mode={settings.labelMode}
              bind:text={settings.label}
            />
          </div>
          <div class="ends">
            <div class="field">
              <span>Left end</span>
              <CapPicker options={CAPS} label="Left end" direction="left" bind:value={settings.startCap} />
            </div>
            <div class="field">
              <span>Right end</span>
              <CapPicker options={CAPS} label="Right end" direction="right" bind:value={settings.endCap} />
            </div>
          </div>
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
  .card-head .hint { text-transform: none; letter-spacing: 0; font-weight: 500; }
  .sections { overflow: hidden; }

  .inequality { padding: 1rem 1.1rem; }
  .help { margin: 0.45rem 0 0; font-size: 0.84rem; color: var(--muted); }
  .help.problem { color: var(--red); font-weight: 600; }
  .graph-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 0.8rem; font-weight: 600; font-size: 0.88rem; }
  .check, .color { display: flex; align-items: center; gap: 0.45rem; cursor: pointer; }
  .color input { width: 2.2rem; height: 1.8rem; padding: 0; border: 1.5px solid var(--border); border-radius: 8px; background: none; cursor: pointer; }

  .range-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; }
  .range-field { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.88rem; min-width: 0; }
  .range-fields { margin-bottom: 0.75rem; }
  .range-fields ~ .help { margin: -0.3rem 0 0.75rem; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .field:last-child { margin-bottom: 0; }
  .field .hint { font-weight: 400; color: var(--muted); }
  .ends { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .ends .field { margin-bottom: 0; }

  .print-sheet { display: none; }
  @media print {
    @page { size: letter portrait; margin: 0.5in; }
    .print-sheet { display: block; width: 7.5in; break-inside: avoid; }
    .print-sheet :global(svg) { width: 100%; height: auto; }
  }
</style>
