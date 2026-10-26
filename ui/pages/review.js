/** Professor: review absence requests and see class statistics for one section. */
import { api, errorText } from '../api.js'
import { el, flash, form, table, when } from '../dom.js'
import { sectionField } from './sections.js'

export function absenceReviewPage(container) {
  const results = el('div')
  const load = async (sectionId) => {
    try {
      const requests = await api.sectionAbsences(sectionId)
      results.replaceChildren(requestTable(requests, () => load(sectionId)))
    } catch (error) {
      flash(errorText(error), true)
    }
  }
  const pick = form(
    ({ section_id: sectionId }) => load(sectionId),
    sectionField(),
    el('button', { type: 'submit' }, 'Load requests'),
  )
  container.append(el('h1', {}, 'Absence requests'), pick, results)
}

/** `reload` runs after a decision so the status column updates. */
function requestTable(requests, reload) {
  if (requests.length === 0) return el('p', {}, 'No absence requests for this section.')
  const decide = (request, status) => async () => {
    try {
      await api.reviewAbsence(request.id, status)
      flash(`Request ${status}. The student has been notified.`)
      reload()
    } catch (error) {
      flash(errorText(error), true)
    }
  }
  const actions = (request) => {
    if (request.status !== 'pending') return ''
    return el(
      'span',
      {},
      el('button', { type: 'button', onclick: decide(request, 'approved') }, 'Approve'),
      ' ',
      el('button', { type: 'button', onclick: decide(request, 'rejected') }, 'Reject'),
    )
  }
  const rows = requests.map((request) => [
    when(request.created_at),
    el('code', {}, request.student_id),
    request.attendance_session_id ?? '',
    request.reason,
    request.status,
    actions(request),
  ])
  return table(['Sent', 'Student id', 'Session id', 'Reason', 'Status', ''], rows)
}

// FIXME: numbers and a table only. Charts come with the design.
export function classStatsPage(container) {
  const results = el('div')
  const pick = form(
    async ({ section_id: sectionId }) => {
      try {
        results.replaceChildren(statsView(await api.sectionStats(sectionId)))
      } catch (error) {
        flash(errorText(error), true)
      }
    },
    sectionField(),
    el('button', { type: 'submit' }, 'Load statistics'),
  )
  container.append(el('h1', {}, 'Class statistics'), pick, results)
}

function statsView(stats) {
  const rows = stats.by_session.map((session) => [
    session.date,
    `${session.confirmed} / ${session.enrolled}`,
    `${session.attendance_percentage}%`,
  ])
  return el(
    'div',
    {},
    el(
      'ul',
      {},
      el('li', {}, `Overall attendance: ${stats.attendance_percentage}%`),
      el('li', {}, `Sessions: ${stats.total_sessions}`),
      el('li', {}, `Enrolled students: ${stats.enrolled_students}`),
    ),
    table(['Date', 'Confirmed', 'Attendance'], rows),
  )
}
