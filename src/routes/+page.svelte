<script>
  // The directory: every generator as a card with a live preview of its
  // figure, then a card for requesting one we don't have.
  import { ArrowRight, Plus } from '@lucide/svelte'
  import { GENERATORS } from '$lib/generators/index.js'
  import Seo from '$lib/site/Seo.svelte'
  import { openRequest } from '$lib/site/request.svelte.js'
</script>

<Seo
  description="Free generators for clean, printable math figures. Make a coordinate grid and more, then copy it straight into a test, worksheet or slide."
  path="/"
/>

<div class="page">
  <header class="hero">
    <h1>Math figures for your tests and worksheets</h1>
    <p>Make one to fit your lesson, then copy it straight into your document. Free, with no sign-up.</p>
  </header>

  <ul class="cards" class:single={GENERATORS.length === 1}>
    {#each GENERATORS as g (g.id)}
      <li>
        <a class="card figure" href={g.path}>
          <div class="preview" aria-hidden="true"><g.Preview /></div>
          <div class="text">
            <h2>{g.name}</h2>
            <p>{g.blurb}</p>
            <span class="go">Make one <ArrowRight size={16} aria-hidden="true" /></span>
          </div>
        </a>
      </li>
    {/each}
    <li>
      <button type="button" class="request" onclick={() => openRequest()}>
        <span class="plus"><Plus size={22} aria-hidden="true" /></span>
        <span class="request-title">Need a different figure?</span>
        <span class="request-text">Request a generator, and we’ll build it.</span>
      </button>
    </li>
  </ul>
</div>

<style>
  .page { max-width: 76rem; margin: 0 auto; padding: 2.25rem 1.25rem 1rem; }
  .hero { max-width: 40rem; margin-bottom: 1.75rem; }
  h1 { font-size: 2rem; font-weight: 800; }
  .hero p { margin: 0.6rem 0 0; color: var(--muted); font-size: 1.05rem; }

  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1.25rem; margin: 0; padding: 0; list-style: none; }
  /* With one generator, its card gets the room and the request card sits beside it. */
  .cards.single { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
  @media (max-width: 760px) { .cards.single { grid-template-columns: minmax(0, 1fr); } }
  .cards li { display: flex; }

  .figure { display: flex; flex-direction: column; width: 100%; overflow: hidden; color: inherit; text-decoration: none; transition: border-color 0.15s, box-shadow 0.15s; }
  .figure:hover { border-color: var(--blue-border); box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 12px 32px -12px rgba(37, 99, 235, 0.35); }
  .preview { display: flex; justify-content: center; padding: 1.25rem; border-bottom: 1px solid var(--border); }
  .preview :global(svg) { width: auto; max-width: 100%; max-height: 22rem; }
  .text { padding: 1rem 1.25rem 1.2rem; }
  h2 { font-size: 1.2rem; font-weight: 800; }
  .text p { margin: 0.35rem 0 0.75rem; color: var(--muted); }
  .go { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--blue-dark); font-weight: 700; }

  .request {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    width: 100%;
    min-height: 14rem;
    padding: 1.5rem;
    border: 2px dashed var(--blue-border);
    border-radius: var(--radius);
    background: transparent;
    color: var(--ink);
    text-align: center;
  }
  .request:hover { background: var(--blue-soft); }
  .plus { display: grid; place-items: center; width: 2.75rem; height: 2.75rem; border-radius: 50%; background: var(--blue-soft); color: var(--blue-dark); margin-bottom: 0.3rem; }
  .request-title { font-weight: 800; font-size: 1.1rem; }
  .request-text { color: var(--muted); }
</style>
