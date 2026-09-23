<script>
  // The one way to reach a person: a question mark in the corner that opens a
  // short dialog, like the other teacher.dev tools.
  import { CircleQuestionMark } from '@lucide/svelte'
  import Modal from './Modal.svelte'

  const SUPPORT_EMAIL = 'support@teacher.dev'

  let open = $state(false)
</script>

<button
  type="button"
  class="help-button no-print"
  aria-label="Help"
  aria-haspopup="dialog"
  onclick={() => (open = true)}
>
  <CircleQuestionMark aria-hidden="true" />
</button>

{#if open}
  <Modal title="Need a hand?" onclose={() => (open = false)}>
    <p>
      If you’re running into trouble or have suggestions, email us at
      <a href="mailto:{SUPPORT_EMAIL}?subject=Graph%20Paper%20Maker">{SUPPORT_EMAIL}</a>.
    </p>
  </Modal>
{/if}

<style>
  .help-button {
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    z-index: 50;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    color: var(--muted);
    background: transparent;
  }
  .help-button :global(svg) { width: 22px; height: 22px; }
  .help-button:hover, .help-button:focus-visible { color: var(--blue-dark); background: var(--blue-soft); }
  a { color: var(--blue-dark); font-weight: 600; text-underline-offset: 4px; }
</style>
