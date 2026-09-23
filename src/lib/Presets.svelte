<script>
  // Built-in and saved starting points. The one matching the current graph is
  // highlighted; saved ones can be deleted.
  import { BookmarkPlus, Check, X } from '@lucide/svelte'
  import { BUILT_IN_PRESETS, deletePreset, loadPresets, savePreset } from './presets.js'
  import { sameGraph } from './settings.js'

  let { settings, onapply } = $props()

  let saved = $state(loadPresets())
  let naming = $state(false)
  let name = $state('')
  let nameInput = $state()

  function startSaving() {
    naming = true
    name = ''
    requestAnimationFrame(() => nameInput?.focus())
  }
  function save(event) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    saved = savePreset(saved, trimmed, settings)
    naming = false
  }
  function onkeydown(event) {
    if (event.key === 'Escape') naming = false
  }
</script>

<div class="presets">
  <div class="chips">
    {#each BUILT_IN_PRESETS as p}
      <button class="chip" class:on={sameGraph(p.settings, settings)} onclick={() => onapply(p.settings)}>{p.name}</button>
    {/each}
    {#each saved as p (p.name)}
      <span class="chip saved" class:on={sameGraph(p.settings, settings)}>
        <button class="apply" onclick={() => onapply(p.settings)}>{p.name}</button>
        <button
          class="remove"
          aria-label="Delete preset {p.name}"
          title="Delete preset"
          onclick={() => (saved = deletePreset(saved, p.name))}
        ><X size={14} aria-hidden="true" /></button>
      </span>
    {/each}
    {#if !naming}
      <button class="chip add" onclick={startSaving}>
        <BookmarkPlus size={15} aria-hidden="true" /> Save preset
      </button>
    {/if}
  </div>
  {#if naming}
    <form class="naming" onsubmit={save}>
      <input bind:this={nameInput} type="text" placeholder="Preset name" aria-label="Preset name" maxlength="40" bind:value={name} {onkeydown} />
      <button class="icon-btn" type="submit" aria-label="Save preset" data-tip="Save" disabled={!name.trim()}><Check size={18} /></button>
      <button class="icon-btn" type="button" aria-label="Cancel" data-tip="Cancel" onclick={() => (naming = false)}><X size={18} /></button>
    </form>
  {/if}
  <p class="hint">Saved presets stay in this browser.</p>
</div>

<style>
  .presets { padding: 1rem 1.1rem 0.9rem; }
  .saved { display: inline-flex; align-items: center; padding: 0; overflow: hidden; }
  .saved button { border: 0; background: transparent; color: inherit; font: inherit; }
  .saved .apply { padding: 0.5rem 0.25rem 0.5rem 0.95rem; }
  .saved .remove { display: grid; place-items: center; padding: 0.5rem 0.6rem 0.5rem 0.3rem; opacity: 0.6; }
  .saved .remove:hover { opacity: 1; }
  .add { display: inline-flex; align-items: center; gap: 0.35rem; border-style: dashed; color: var(--blue-dark); }
  .naming { display: flex; gap: 0.35rem; margin-top: 0.6rem; }
  .naming input { flex: 1; }
  .hint { margin: 0.6rem 0 0; font-size: 0.8rem; color: var(--muted); }
</style>
