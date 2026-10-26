/** The logged-in user's notifications: cancelled classes and absence decisions. */
import { api, errorText } from '../api.js'
import { el, flash, table, when } from '../dom.js'

export async function notificationsPage(container) {
  container.append(el('h1', {}, 'Notifications'))
  try {
    const notifications = await api.notifications()
    if (notifications.length === 0) {
      container.append(el('p', {}, 'No notifications.'))
      return
    }
    const rows = notifications.map((note) => [when(note.created_at), note.title, note.message])
    container.append(table(['Received', 'Title', 'Message'], rows))
  } catch (error) {
    flash(errorText(error), true)
  }
}
