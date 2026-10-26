/**
 * Calls to the Attendance API. Every page talks to the server through `api` here.
 * The access token is kept in memory only (the docs forbid localStorage), so a reload logs out.
 */

const BASE = '/api/v1'

let token = null
let onUnauthorized = () => {}

/** An error response from the API, with its HTTP status. */
export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : JSON.stringify(detail))
    this.status = status
  }
}

export function setToken(value) {
  token = value
}

/** Called when a request comes back 401 while logged in, i.e. the session expired. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

/**
 * The claims inside the access token: `sub` (user id) and `role`.
 * Used to pick the menu only; the server still checks the role on every call.
 */
export function tokenClaims() {
  if (!token) return null
  const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(payload))
}

/** A message for the user from any error a call can throw. */
export function errorText(error) {
  if (error instanceof ApiError) return error.message
  return 'Could not reach the server.'
}

async function request(method, path, { json, form } = {}) {
  const headers = {}
  let body
  if (token) headers.Authorization = `Bearer ${token}`
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  }
  if (form) body = new URLSearchParams(form)

  const response = await fetch(BASE + path, { method, headers, body })
  const data = await response.json().catch(() => null)
  if (response.ok) return data
  if (response.status === 401 && token) onUnauthorized()
  throw new ApiError(response.status, data?.detail ?? response.statusText)
}

const id = encodeURIComponent

export const api = {
  register: (user) => request('POST', '/auth/register', { json: user }),
  login: (email, password) =>
    request('POST', '/auth/token', { form: { username: email, password } }),

  createSection: (name) => request('POST', '/sections', { json: { name } }),
  enroll: (sectionId, studentId) =>
    request('POST', `/sections/${id(sectionId)}/enrollments`, { json: { student_id: studentId } }),

  openSession: (settings) => request('POST', '/attendance-sessions', { json: settings }),
  refreshQr: (sessionId) => request('POST', `/attendance-sessions/${id(sessionId)}/qr-token`),
  rotateCode: (sessionId) => request('POST', `/attendance-sessions/${id(sessionId)}/rotate-code`),
  cancelSession: (sessionId) => request('POST', `/attendance-sessions/${id(sessionId)}/cancel`),
  confirm: (sessionId, proof) =>
    request('POST', `/attendance-sessions/${id(sessionId)}/confirm`, { json: proof }),

  requestAbsence: (absence) => request('POST', '/absence-requests', { json: absence }),
  sectionAbsences: (sectionId) => request('GET', `/sections/${id(sectionId)}/absence-requests`),
  reviewAbsence: (requestId, status) =>
    request('PATCH', `/absence-requests/${id(requestId)}`, { json: { status } }),

  notifications: () => request('GET', '/notifications'),
  myStats: () => request('GET', '/students/me/statistics'),
  sectionStats: (sectionId) => request('GET', `/sections/${id(sectionId)}/statistics`),
}
