/** Professor: start attendance, show the code and QR token, rotate or cancel. */
import { api, errorText } from '../api.js'
import { el, field, flash, form, when } from '../dom.js'
import { currentPosition } from '../geo.js'
import { sectionField } from './sections.js'

/** QR tokens live 30 seconds; docs/ui-api.md says to refresh about every 20. */
const QR_REFRESH_MS = 20_000

/** The open session, kept in memory only so the code and token never reach browser storage. */
let active = null

/** Returns a clean-up function that stops the QR refresh when the page is left. */
export function sessionPage(container) {
  if (!active) {
    startForm(container)
    return () => {}
  }
  const timer = setInterval(() => refreshQr(container), QR_REFRESH_MS)
  showActive(container)
  return () => clearInterval(timer)
}

function startForm(container) {
  const latitude = el('input', { name: 'latitude', type: 'number', step: 'any', min: -90, max: 90 })
  const longitude = el('input', {
    name: 'longitude',
    type: 'number',
    step: 'any',
    min: -180,
    max: 180,
  })
  const useHere = async () => {
    try {
      const here = await currentPosition()
      latitude.value = here.latitude
      longitude.value = here.longitude
    } catch (error) {
      flash(error.message, true)
    }
  }

  const start = form(
    async (values) => {
      try {
        active = await api.openSession(sessionSettings(values))
        flash('')
        reopen(container)
      } catch (error) {
        flash(errorText(error), true)
      }
    },
    sectionField(),
    field('Duration in minutes', {
      name: 'duration_minutes',
      type: 'number',
      min: 1,
      max: 120,
      value: 15,
    }),
    el(
      'fieldset',
      {},
      el('legend', {}, 'Classroom location (optional)'),
      el('label', {}, 'Latitude', latitude),
      el('label', {}, 'Longitude', longitude),
      field('Allowed radius in metres (10 to 1000)', {
        name: 'allowed_radius_meters',
        type: 'number',
        min: 10,
        max: 1000,
      }),
      el('button', { type: 'button', onclick: useHere }, 'Use my current location'),
    ),
    el('button', { type: 'submit' }, 'Start attendance'),
  )
  container.append(el('h1', {}, 'Start attendance'), start)
}

/** Location is sent only when all three location fields are filled, as the API requires. */
function sessionSettings(values) {
  const settings = {
    section_id: values.section_id,
    duration_minutes: Number(values.duration_minutes),
  }
  if (!values.latitude && !values.longitude && !values.allowed_radius_meters) return settings
  return {
    ...settings,
    location_latitude: Number(values.latitude),
    location_longitude: Number(values.longitude),
    allowed_radius_meters: Number(values.allowed_radius_meters),
  }
}

// FIXME: the QR token is shown as text, not drawn as a QR image, and there is no live list of
// confirmations because the API has no endpoint for it yet.
function showActive(container) {
  container.append(
    el('h1', {}, 'Attendance is open'),
    el('p', {}, 'Session id: ', el('code', {}, active.id)),
    el('p', {}, 'Code:'),
    el('p', { class: 'code-display mono' }, active.code),
    el('p', {}, `Ends at ${when(active.expires_at)}`),
    el('p', {}, active.location_required ? 'Location is required.' : 'Location is not required.'),
    el('p', {}, 'QR token (refreshes every 20 seconds):'),
    el('p', { class: 'mono' }, active.qr_token),
    el('button', { type: 'button', onclick: () => rotate(container) }, 'New code'),
    ' ',
    el('button', { type: 'button', onclick: () => cancel(container) }, 'Cancel attendance'),
    ' ',
    el('button', { type: 'button', onclick: () => close(container) }, 'Hide'),
  )
}

async function refreshQr(container) {
  try {
    const { qr_token: qrToken } = await api.refreshQr(active.id)
    active.qr_token = qrToken
    reopen(container)
  } catch (error) {
    flash(`Attendance has ended: ${errorText(error)}`, true)
    close(container)
  }
}

/** For when the code was shared outside the room: the old code and QR tokens stop working. */
async function rotate(container) {
  try {
    const rotated = await api.rotateCode(active.id)
    active.code = rotated.code
    active.qr_token = rotated.qr_token
    flash('New code issued. The old one no longer works.')
    reopen(container)
  } catch (error) {
    flash(errorText(error), true)
  }
}

async function cancel(container) {
  if (!window.confirm('Cancel this attendance session? Every enrolled student is notified.')) {
    return
  }
  try {
    const result = await api.cancelSession(active.id)
    flash(`Attendance cancelled. ${result.notifications_sent} students notified.`)
    close(container)
  } catch (error) {
    flash(errorText(error), true)
  }
}

/** Stops showing the session. It stays open on the server until it ends. */
function close(container) {
  active = null
  reopen(container)
}

/** Redraws the page through the router so the QR timer is started or stopped correctly. */
function reopen(container) {
  container.dispatchEvent(new CustomEvent('reopen', { bubbles: true }))
}
