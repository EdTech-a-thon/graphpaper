<script>
  import { findGenerator } from '$lib/generators/index.js'
  import Builder from '$lib/generators/coordinate-grid/Builder.svelte'
  import Seo from '$lib/site/Seo.svelte'

  const generator = findGenerator('/coordinate-grid')
</script>

<Seo title={generator.name} description={generator.description} path={generator.path} />
<Builder />
