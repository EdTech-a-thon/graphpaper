<script>
  // One label (title or axis name): written text, a blank line for students to
  // write on, or nothing at all.
  import { Ban, PencilLine, Type } from '@lucide/svelte'

  let { name, mode = $bindable(), text = $bindable(), placeholder = '' } = $props()

  const MODES = [
    ['text', 'Text', Type],
    ['blank', 'Blank line', PencilLine],
    ['none', 'None', Ban],
  ]
</script>

<div class="label-field">
  <div class="segmented" role="radiogroup" aria-label="{name} label">
    {#each MODES as [value, label, Icon]}
      <button
        type="button"
        role="radio"
        aria-checked={mode === value}
        class:on={mode === value}
        onclick={() => (mode = value)}
      >
        <Icon size={15} aria-hidden="true" />
        {label}
      </button>
    {/each}
  </div>
  {#if mode === 'text'}
    <input type="text" aria-label="{name} text" {placeholder} bind:value={text} />
  {:else if mode === 'blank'}
    <p class="note">Students write the {name.toLowerCase()} on a blank line.</p>
  {/if}
</div>

<style>
  .label-field { display: flex; flex-direction: column; gap: 0.5rem; }
  .note { margin: 0; font-size: 0.85rem; color: var(--muted); }
</style>
