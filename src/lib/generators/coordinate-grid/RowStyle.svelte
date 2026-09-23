<script>
  // The palette button beside an equation: a small popup to pick its color, and
  // for a line its style and which ends get arrows. Fixed-position like
  // CapPicker's menu, so the scrolling settings column can't clip it.
  import { tick } from 'svelte'
  import { Palette } from '@lucide/svelte'
  import { ARROWS, COLORS, LINE_STYLES } from './equations.js'

  // row: { color, line, arrows }, edited in place. isPoints: only color applies.
  let { row, label, id, isPoints = false } = $props()

  let open = $state(false)
  let root = $state()
  let trigger = $state()
  let panel = $state()
  let pos = $state({ left: 0, top: 0 })

  const GAP = 6
  const EDGE = 8

  async function show() {
    open = true
    await tick()
    const r = trigger.getBoundingClientRect()
    const h = panel.offsetHeight
    const w = panel.offsetWidth
    const below = r.bottom + GAP + h <= window.innerHeight - EDGE
    pos = {
      top: Math.max(EDGE, below ? r.bottom + GAP : r.top - GAP - h),
      left: Math.max(EDGE, Math.min(r.right - w, window.innerWidth - EDGE - w)),
    }
    panel.querySelector('[aria-checked=true]')?.focus()
  }
  function hide(refocus = true) {
    open = false
    if (refocus) trigger?.focus()
  }
  function onpointerdown(event) {
    if (open && !root.contains(event.target)) hide(false)
  }
  function onkeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      hide()
    }
  }
</script>

<svelte:window {onpointerdown} onresize={() => open && hide(false)} onscrollcapture={(e) => open && !panel?.contains(e.target) && hide(false)} />

{#snippet lineIcon(style)}
  <svg viewBox="0 0 28 12" width="28" height="12" aria-hidden="true">
    <line
      x1="3" y1="6" x2="25" y2="6" stroke="currentColor" stroke-width="2.5"
      stroke-dasharray={style === 'dashed' ? '6 4' : style === 'dotted' ? '0.01 4.5' : undefined}
      stroke-linecap={style === 'dotted' ? 'round' : 'butt'}
    />
  </svg>
{/snippet}

{#snippet arrowIcon(ends)}
  <svg viewBox="0 0 28 12" width="28" height="12" aria-hidden="true" fill="currentColor" stroke="currentColor" stroke-width="2">
    <line x1={ends === 'both' || ends === 'left' ? 8 : 3} y1="6" x2={ends === 'both' || ends === 'right' ? 20 : 25} y2="6" />
    {#if ends === 'both' || ends === 'left'}<path d="M2,6 L9,2 L9,10 z" stroke="none" />{/if}
    {#if ends === 'both' || ends === 'right'}<path d="M26,6 L19,2 L19,10 z" stroke="none" />{/if}
  </svg>
{/snippet}

<div class="row-style" bind:this={root}>
  <button
    bind:this={trigger}
    type="button"
    class="icon-btn outline"
    aria-haspopup="dialog"
    aria-expanded={open}
    aria-label="Customize {label}"
    data-tip={open ? undefined : 'Customize'}
    onclick={() => (open ? hide() : show())}
  >
    <Palette size={17} color={row.color === 'black' ? undefined : COLORS[row.color]} />
  </button>

  {#if open}
    <div
      bind:this={panel}
      class="panel"
      role="dialog"
      tabindex="-1"
      aria-label="Customize {label}"
      style="left: {pos.left}px; top: {pos.top}px"
      {onkeydown}
    >
      <div class="group">
        <span class="name" id="{id}-color">Color</span>
        <div class="swatches" role="radiogroup" aria-labelledby="{id}-color">
          {#each Object.entries(COLORS) as [name, hex]}
            <button
              type="button"
              class="swatch"
              role="radio"
              aria-checked={row.color === name}
              aria-label={name}
              title={name[0].toUpperCase() + name.slice(1)}
              style="--swatch: {hex}"
              onclick={() => (row.color = name)}
            ></button>
          {/each}
        </div>
      </div>

      {#if !isPoints}
        <div class="group">
          <span class="name" id="{id}-line">Line</span>
          <div class="segmented" role="radiogroup" aria-labelledby="{id}-line">
            {#each Object.entries(LINE_STYLES) as [v, name]}
              <button type="button" role="radio" aria-checked={row.line === v} aria-label={name} title={name} class:on={row.line === v} onclick={() => (row.line = v)}>
                {@render lineIcon(v)}
              </button>
            {/each}
          </div>
        </div>

        <div class="group">
          <span class="name" id="{id}-arrows">Arrows</span>
          <div class="segmented" role="radiogroup" aria-labelledby="{id}-arrows">
            {#each Object.entries(ARROWS) as [v, name]}
              <button type="button" role="radio" aria-checked={row.arrows === v} aria-label={name} title={name} class:on={row.arrows === v} onclick={() => (row.arrows = v)}>
                {@render arrowIcon(v)}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Outlined, so it reads as a secondary action apart from the plain × beside it. */
  .outline { width: 2.1rem; height: 2.1rem; border: 1.5px solid var(--border); background: #fff; }
  .outline:hover:not(:disabled), .outline[aria-expanded='true'] { border-color: var(--blue-border); background: var(--blue-soft); }
  .panel {
    position: fixed;
    z-index: 60;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 12px 32px -8px rgb(17 24 39 / 25%);
  }
  .group { display: flex; flex-direction: column; gap: 0.35rem; }
  .name { font-size: 0.75rem; font-weight: 700; color: var(--muted); }
  .swatches { display: flex; gap: 0.4rem; }
  .swatch {
    width: 1.6rem;
    height: 1.6rem;
    padding: 0;
    border: 2px solid #fff;
    border-radius: 6px;
    background: var(--swatch);
    box-shadow: 0 0 0 1px var(--border);
    cursor: pointer;
  }
  .swatch[aria-checked='true'] { box-shadow: 0 0 0 2px var(--blue); }
  .swatch:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--blue), 0 0 0 4px var(--blue-border); }
  .segmented button { display: inline-grid; place-items: center; padding: 0.3rem 0.45rem; }
</style>
