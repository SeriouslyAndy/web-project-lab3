/**
 * Small helpers for building pages. Text always goes in as text nodes, never as HTML,
 * so names and reasons typed by users can't inject markup.
 */

/**
 * Creates an element. `props` keys starting with "on" become event listeners,
 * everything else becomes an attribute. Strings and numbers in `children` become text.
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value === false || value === null || value === undefined) continue
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value)
    else node.setAttribute(key, value === true ? '' : value)
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue
    node.append(child instanceof Node ? child : String(child))
  }
  return node
}

/** A labelled input. `props` go on the input, e.g. `{ name: 'email', type: 'email' }`. */
export function field(label, props) {
  return el('label', {}, label, el('input', props))
}

/** A form whose submit handler gets the fields as a plain object. */
export function form(onSubmit, ...children) {
  const node = el('form', {}, ...children)
  node.addEventListener('submit', (event) => {
    event.preventDefault()
    onSubmit(Object.fromEntries(new FormData(node)), node)
  })
  return node
}

/** A table from column headings and rows of cell values or nodes. */
export function table(headings, rows) {
  const head = el(
    'tr',
    {},
    headings.map((heading) => el('th', {}, heading)),
  )
  const body = rows.map((row) =>
    el(
      'tr',
      {},
      row.map((cell) => el('td', {}, cell)),
    ),
  )
  return el('table', {}, el('thead', {}, head), el('tbody', {}, body))
}

/** Shows a message under the header. Errors are marked so they stand out. */
export function flash(message, isError = false) {
  const box = document.getElementById('flash')
  box.textContent = message
  box.className = isError ? 'error' : ''
  box.hidden = !message
}

/** Turns an ISO timestamp from the API into the browser's local date and time. */
export function when(timestamp) {
  return new Date(timestamp).toLocaleString()
}
