/** Student pages: confirm attendance, request an absence, see own statistics. */
import { api, errorText } from '../api.js'
import { el, field, flash, form, table } from '../dom.js'
import { currentPosition } from '../geo.js'

/** What each failed confirmation means, from docs/ui-api.md. */
const CONFIRM_ERRORS = {
  400: 'That code or QR token is not valid.',
  403: 'You are not enrolled in this class, or you are outside the allowed area.',
  404: 'This attendance session is not open.',
  409: 'Already confirmed, QR already used, or this device was used by another student.',
  410: 'This attendance session has expired.',
  429: 'Too many failed attempts. Wait a few minutes and try again.',
}

// FIXME: students type the session id by hand. The API has no "my classes" or "open sessions"
// endpoint to list them, and there is no QR scanner yet.
export function attendPage(container) {
  const confirm = form(
    async ({ session_id: sessionId, code, qr_token: qrToken, share_location: share }) => {
      if (!code && !qrToken) {
        flash('Enter the class code or a QR token.', true)
        return
      }
      try {
        const proof = { code: code || null, qr_token: qrToken || null }
        if (share) Object.assign(proof, await currentPosition())
        const record = await api.confirm(sessionId, proof)
        flash(`Attendance confirmed (${record.status}).`)
      } catch (error) {
        flash(CONFIRM_ERRORS[error.status] ?? errorText(error), true)
      }
    },
    field('Session id', { name: 'session_id', required: true }),
    field('Class code', { name: 'code', autocomplete: 'off' }),
    field('Or QR token', { name: 'qr_token', autocomplete: 'off' }),
    el(
      'label',
      {},
      el('input', { type: 'checkbox', name: 'share_location' }),
      ' Share my location (only if the professor turned location on)',
    ),
    el('button', { type: 'submit' }, 'Confirm attendance'),
  )
  container.append(el('h1', {}, 'Confirm attendance'), confirm)
}

// FIXME: no request history. The API has no endpoint for a student's own absence requests.
export function absencePage(container) {
  const request = form(
    async (values, node) => {
      try {
        await api.requestAbsence({
          section_id: values.section_id,
          attendance_session_id: values.attendance_session_id || null,
          reason: values.reason,
          attachment_url: values.attachment_url || null,
        })
        node.reset()
        flash('Absence request sent. You will get a notification when it is reviewed.')
      } catch (error) {
        flash(errorText(error), true)
      }
    },
    field('Section id', { name: 'section_id', required: true }),
    field('Session id (optional)', { name: 'attendance_session_id' }),
    el(
      'label',
      {},
      'Reason (at least 10 characters)',
      el('textarea', { name: 'reason', required: true, minlength: 10, maxlength: 2000 }),
    ),
    field('Attachment link (optional)', { name: 'attachment_url', type: 'url' }),
    el('button', { type: 'submit' }, 'Send request'),
  )
  container.append(el('h1', {}, 'Request absence'), request)
}

// FIXME: numbers and a table only. Charts come with the design.
export async function myStatsPage(container) {
  container.append(el('h1', {}, 'My statistics'))
  try {
    const stats = await api.myStats()
    container.append(
      el('p', {}, 'Your student id: ', el('code', {}, stats.student_id)),
      el(
        'ul',
        {},
        el('li', {}, `Attendance: ${stats.attendance_percentage}%`),
        el('li', {}, `Present: ${stats.present}`),
        el('li', {}, `Late: ${stats.late}`),
        el('li', {}, `Absent: ${stats.absent}`),
      ),
      table(
        ['Date', 'Status'],
        stats.by_session.map((session) => [session.date, session.status]),
      ),
    )
  } catch (error) {
    flash(errorText(error), true)
  }
}
