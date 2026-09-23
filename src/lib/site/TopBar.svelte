<script>
  // On every page: the Math Figures name (back to the directory), the current
  // generator's name, and the search box.
  import { ChevronRight } from '@lucide/svelte'
  import { page } from '$app/state'
  import { findGenerator } from '$lib/generators/index.js'
  import Search from './Search.svelte'
  import { SITE_NAME } from './config.js'

  const current = $derived(findGenerator(page.url.pathname))
</script>

<header class="topbar no-print">
  <nav class="trail" aria-label="Breadcrumb">
    <a class="home" href="/">
      <img src="/favicon.svg" alt="" width="28" height="28" />
      <span>{SITE_NAME}</span>
    </a>
    {#if current}
      <ChevronRight size={16} aria-hidden="true" class="sep" />
      <span class="current" aria-current="page">{current.name}</span>
    {/if}
  </nav>
  <Search />
</header>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    height: var(--topbar-h);
    padding: 0 1.25rem;
    background: #fff;
    border-bottom: 1px solid var(--border);
  }
  .trail { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
  .home { display: inline-flex; align-items: center; gap: 0.55rem; color: var(--ink); text-decoration: none; font-weight: 800; font-size: 1.1rem; white-space: nowrap; }
  .trail :global(.sep) { color: var(--muted); flex: none; }
  .current { color: var(--muted); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* Phones keep the site name and drop the generator's name, which the page shows anyway. */
  @media (max-width: 640px) {
    .trail :global(.sep), .current { display: none; }
  }
</style>
