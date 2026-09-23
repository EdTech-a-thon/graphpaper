<script>
  // The number line itself, as a self-contained SVG that prints crisply and
  // exports cleanly to PNG/SVG (fonts and colors are inline, no page CSS).
  import { buildLine } from './numberline.js'
  import { INK } from './settings.js'

  let { settings, svg = $bindable(), id = 'n' } = $props()

  const g = $derived(buildLine(settings))
  const cap = (c) => (c === 'none' ? undefined : `url(#${id}-${c})`)
  const SANS = 'Arial, Helvetica, sans-serif'
  const SERIF = "'Times New Roman', Times, serif"
</script>

<svg
  bind:this={svg}
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {g.width} {g.height}"
  width={g.width}
  height={g.height}
  role="img"
  aria-label={settings.title || (settings.showGraph && settings.inequality) || 'Number line'}
>
  <defs>
    <!-- Axis end caps; the axis runs from its start (left) to its end (right). -->
    <marker id="{id}-triangle" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="13" markerHeight="13" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill={INK} />
    </marker>
    <marker id="{id}-line" viewBox="0 0 10 10" refX="8.6" refY="5" markerWidth="13" markerHeight="13" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
      <path d="M1.5,1 L8.6,5 L1.5,9" fill="none" stroke={INK} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </marker>
    <marker id="{id}-circle" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse">
      <circle cx="5" cy="5" r="5" fill={INK} />
    </marker>
  </defs>

  <rect width={g.width} height={g.height} fill="#fff" />

  <line
    x1={g.axis.x1} y1={g.axis.y} x2={g.axis.x2} y2={g.axis.y} stroke={INK} stroke-width="2.4"
    marker-start={cap(settings.startCap)} marker-end={cap(settings.endCap)}
  />
  <g stroke={INK} stroke-width="2">
    {#each g.ticks as t}<line x1={t.x} y1={t.y1} x2={t.x} y2={t.y2} />{/each}
  </g>

  <g stroke={settings.graphColor} stroke-width="6">
    {#each g.segments as s}<line x1={s.x1} y1={g.axis.y} x2={s.x2} y2={g.axis.y} />{/each}
  </g>
  {#each g.endpoints as e}
    <circle cx={e.x} cy={g.axis.y} r={g.r} fill={e.closed ? settings.graphColor : '#fff'} stroke={settings.graphColor} stroke-width="2.5" />
  {/each}

  <g font-family={SANS} font-size={g.fs} font-weight="bold" fill={INK} text-anchor="middle">
    {#each g.numbers as n}
      {#if n.den}
        <text x={n.x} y={n.numY}>{n.num}</text>
        <line x1={n.x - Math.max(n.num.length, n.den.length) * g.fs * 0.32 - 1} y1={n.barY} x2={n.x + Math.max(n.num.length, n.den.length) * g.fs * 0.32 + 1} y2={n.barY} stroke={INK} stroke-width="1.5" />
        <text x={n.x} y={n.denY}>{n.den}</text>
        {#if n.sign}
          <text x={n.x - Math.max(n.num.length, n.den.length) * g.fs * 0.32 - 3} y={n.barY + g.fs * 0.35} text-anchor="end">{n.sign}</text>
        {/if}
      {:else}
        <text x={n.x} y={n.y}>{n.text}</text>
      {/if}
    {/each}
  </g>

  {#if g.title}
    <text x={g.title.x} y={g.title.y} text-anchor="middle" font-family={SANS} font-size={g.fs * 1.6} font-weight="bold" fill={INK}>{g.title.text}</text>
  {:else if g.titleBlank}
    <line x1={g.titleBlank.x1} y1={g.titleBlank.y} x2={g.titleBlank.x2} y2={g.titleBlank.y} stroke={INK} stroke-width="1.5" />
  {/if}
  {#if g.tip}
    <text x={g.tip.x} y={g.tip.y} font-family={SERIF} font-style="italic" font-weight="bold" font-size={g.fs * 1.4} fill={INK}>{g.tip.text}</text>
  {/if}
</svg>

<style>
  svg { display: block; width: 100%; height: auto; }
</style>
