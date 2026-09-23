<script>
  // Pages by address: the graph builder at /, plus about and privacy.
  import Builder from './lib/Builder.svelte'
  import About from './lib/About.svelte'
  import Privacy from './lib/Privacy.svelte'
  import Footer from './lib/Footer.svelte'
  import Help from './lib/Help.svelte'

  const path = window.location.pathname.replace(/\/$/, '') || '/'
</script>

<div class="shell">
  <main>
    {#if path === '/about'}
      <About />
    {:else if path === '/privacy'}
      <Privacy />
    {:else}
      <Builder />
    {/if}
  </main>
  <Footer />
  <Help />
</div>

<style>
  .shell { display: flex; flex-direction: column; min-height: 100vh; }
  main { flex: 1; }
  @media print { .shell { display: block; min-height: 0; } }
</style>
