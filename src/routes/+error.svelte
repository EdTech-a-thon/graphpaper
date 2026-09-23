<script>
  import { page } from '$app/state'
</script>

<svelte:head><title>Not found | Math Figures</title></svelte:head>

<div class="page">
  <h1>{page.status === 404 ? 'We couldn’t find that page' : 'Something went wrong'}</h1>
  <p>Try the search box above, or <a href="/">see every figure</a>.</p>
</div>

<style>
  .page { max-width: 46rem; margin: 0 auto; padding: 3rem 1.25rem; }
  h1 { font-size: 1.6rem; font-weight: 800; }
  p { color: var(--muted); }
  a { color: var(--blue-dark); font-weight: 600; }
</style>
