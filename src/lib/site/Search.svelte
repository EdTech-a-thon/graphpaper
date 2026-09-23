<script>
  // The top bar search, which is also how you move between generators:
  // focusing it lists every generator, typing narrows the list, and the list
  // always ends with Request a generator. With no matches, requesting is the
  // one thing on offer.
  import { Plus, Search } from '@lucide/svelte'
  import { goto } from '$app/navigation'
  import { searchGenerators } from '$lib/generators/index.js'
  import { openRequest } from './request.svelte.js'

  let query = $state('')
  let open = $state(false)
  let active = $state(0)
  let root = $state()
  let input = $state()

  const results = $derived(searchGenerators(query))
  // Options in order: each result, then the request row.
  const count = $derived(results.length + 1)
  const listId = 'search-results'
  const optionId = (i) => `search-option-${i}`

  $effect(() => {
    query
    active = 0
  })

  function choose(i) {
    const target = results[i]
    open = false
    input?.blur()
    if (target) {
      query = ''
      goto(target.path)
    } else {
      openRequest(query)
    }
  }

  function onkeydown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      open = true
      active = (active + (event.key === 'ArrowDown' ? 1 : count - 1)) % count
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(active)
    } else if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        open = false
      } else {
        input?.blur()
      }
    }
  }
  function onpointerdown(event) {
    if (open && !root.contains(event.target)) open = false
  }
</script>

<svelte:window {onpointerdown} />

<div class="search" bind:this={root}>
  <Search size={17} aria-hidden="true" class="glass" />
  <input
    bind:this={input}
    bind:value={query}
    type="search"
    placeholder="Search figures"
    aria-label="Search figures"
    role="combobox"
    aria-expanded={open}
    aria-controls={listId}
    aria-autocomplete="list"
    aria-activedescendant={open ? optionId(active) : undefined}
    autocomplete="off"
    onfocus={() => (open = true)}
    oninput={() => (open = true)}
    {onkeydown}
  />

  {#if open}
    <div class="panel">
      {#if !results.length}
        <div class="empty">
          <p>No generator for “{query.trim()}” yet.</p>
        </div>
      {/if}
      <ul id={listId} role="listbox" aria-label="Generators">
        {#each results as g, i (g.id)}
          <!-- Keyboard use goes through the input (arrow keys + Enter), as in any combobox. -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <li
            id={optionId(i)}
            role="option"
            aria-selected={active === i}
            class:active={active === i}
            onpointerdown={(e) => e.preventDefault()}
            onpointerenter={() => (active = i)}
            onclick={() => choose(i)}
          >
            <span class="name">{g.name}</span>
            <span class="blurb">{g.blurb}</span>
          </li>
        {/each}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <li
          id={optionId(results.length)}
          role="option"
          aria-selected={active === results.length}
          class="request"
          class:active={active === results.length}
          class:alone={!results.length}
          onpointerdown={(e) => e.preventDefault()}
          onpointerenter={() => (active = results.length)}
          onclick={() => choose(results.length)}
        >
          <Plus size={16} aria-hidden="true" /> Request a generator
        </li>
      </ul>
    </div>
  {/if}
</div>

<style>
  .search { position: relative; width: min(22rem, 100%); }
  .search :global(.glass) { position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
  input[type='search'] { padding-left: 2.1rem; background: var(--bg); border-color: transparent; }
  input[type='search']:focus { background: #fff; border-color: var(--blue); }

  .panel {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 70;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 12px 32px -8px rgb(17 24 39 / 25%);
  }
  ul { margin: 0; padding: 0; list-style: none; }
  li { display: flex; flex-direction: column; gap: 0.1rem; padding: 0.55rem 0.7rem; border-radius: 8px; cursor: pointer; }
  li.active { background: var(--blue-soft); }
  .name { font-weight: 700; font-size: 0.95rem; }
  .blurb { font-size: 0.82rem; color: var(--muted); }
  .request {
    flex-direction: row;
    align-items: center;
    gap: 0.4rem;
    margin-top: 4px;
    border-top: 1px solid var(--border);
    border-radius: 0 0 8px 8px;
    color: var(--blue-dark);
    font-weight: 700;
    font-size: 0.9rem;
  }
  .request.active { border-top-color: transparent; border-radius: 8px; }
  /* With nothing found, requesting is the one thing on offer: a centred button. */
  .empty { padding: 1rem 0.75rem 0.25rem; text-align: center; }
  .empty p { margin: 0; color: var(--muted); font-size: 0.92rem; }
  .request.alone {
    justify-content: center;
    width: max-content;
    margin: 0.75rem auto 0.75rem;
    padding: 0.6rem 1rem;
    border: 0;
    border-radius: 10px;
    background: var(--blue);
    color: #fff;
  }
  .request.alone.active { background: var(--blue-dark); }
</style>
