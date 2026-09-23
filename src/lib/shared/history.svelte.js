// Undo/redo for a generator's settings. A change is recorded once the
// settings have been still for a moment, so typing a title is one step rather
// than one per letter. Call during component setup.
//
//   read():      a plain snapshot of the current settings
//   write(snap): put a snapshot back as the live settings
//   keyOf(snap): a string that is equal when two snapshots draw the same figure

export function createHistory({ read, write, keyOf, delay = 500 }) {
  let past = $state.raw([])
  let future = $state.raw([])
  let current = read()
  let currentKey = $state(keyOf(current))
  const liveKey = $derived(keyOf(read()))
  let timer

  function record() {
    clearTimeout(timer)
    if (liveKey === currentKey) return
    past = [...past, current]
    future = []
    current = read()
    currentKey = liveKey
  }

  $effect(() => {
    liveKey
    clearTimeout(timer)
    timer = setTimeout(record, delay)
    return () => clearTimeout(timer)
  })

  function go(to) {
    current = to
    currentKey = keyOf(to)
    write(structuredClone(to))
  }

  function undo() {
    record()
    if (!past.length) return
    future = [...future, current]
    go(past.at(-1))
    past = past.slice(0, -1)
  }
  function redo() {
    record()
    if (!future.length) return
    past = [...past, current]
    go(future.at(-1))
    future = future.slice(0, -1)
  }
  /** Cmd/Ctrl+Z and Shift+Cmd+Z / Ctrl+Y, outside text boxes (they keep their own undo). */
  function onkeydown(event) {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return
    if (event.target.matches?.('input[type=text], input[type=number], input[type=search], textarea')) return
    const key = event.key.toLowerCase()
    if (key === 'z' && !event.shiftKey) undo()
    else if ((key === 'z' && event.shiftKey) || key === 'y') redo()
    else return
    event.preventDefault()
  }

  return {
    get canUndo() {
      return past.length > 0 || liveKey !== currentKey
    },
    get canRedo() {
      return future.length > 0
    },
    undo,
    redo,
    onkeydown,
  }
}
