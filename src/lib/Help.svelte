<script>
  // The one way to reach a person: a question mark in the corner that opens a
  // short dialog, like the other teacher.dev tools.
  import { CircleQuestionMark, X } from '@lucide/svelte'

  const SUPPORT_EMAIL = 'support@teacher.dev'

  let open = $state(false)
  let trigger = $state()
  let dialog = $state()

  function show() {
    open = true
    requestAnimationFrame(() => focusable()[0]?.focus())
  }
  function close() {
    open = false
    requestAnimationFrame(() => trigger?.focus())
  }
  const focusable = () => Array.from(dialog?.querySelectorAll('a[href], button:not(:disabled)') ?? [])

  function onkeydown(event) {
    if (!open) return
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }
    if (event.key !== 'Tab') return
    const controls = focusable()
    if (!controls.length) return
    const first = controls[0]
    const last = controls.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
</script>

<svelte:window {onkeydown} />

<button
  bind:this={trigger}
  type="button"
  class="help-button no-print"
  aria-label="Help"
  aria-haspopup="dialog"
  onclick={show}
>
  <CircleQuestionMark aria-hidden="true" />
</button>

{#if open}
  <div
    class="backdrop no-print"
    role="presentation"
    onmousedown={(event) => { if (event.target === event.currentTarget) close() }}
  >
    <section bind:this={dialog} class="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <header>
        <h2 id="help-title">Need a hand?</h2>
        <button type="button" class="close" aria-label="Close help" onclick={close}><X aria-hidden="true" /></button>
      </header>
      <p>
        If you’re running into trouble or have suggestions, email us at
        <a href="mailto:{SUPPORT_EMAIL}?subject=Graph%20Paper%20Maker">{SUPPORT_EMAIL}</a>.
      </p>
    </section>
  </div>
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
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    padding: 28px;
    display: grid;
    place-items: center;
    background: rgb(17 24 39 / 42%);
    backdrop-filter: blur(2px);
  }
  .help-dialog {
    width: min(440px, calc(100vw - 32px));
    padding: 20px;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 18px 60px rgb(17 24 39 / 24%);
  }
  header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
  h2 { margin: 0; font-size: 20px; }
  .close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 6px;
    color: var(--muted);
    background: transparent;
  }
  .close:hover { border-color: var(--border); background: var(--blue-soft); }
  .close :global(svg) { width: 16px; height: 16px; stroke-width: 2; }
  p { margin: 0; font-size: 15px; line-height: 1.6; }
  a { color: var(--blue-dark); font-weight: 600; text-underline-offset: 4px; }
</style>
