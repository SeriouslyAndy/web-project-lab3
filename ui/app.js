/** Entry point: logging in and out, the menu for the user's role, and moving between pages. */
import { setToken, setUnauthorizedHandler, tokenClaims } from './api.js'
import { el, flash } from './dom.js'
import { loginPage } from './pages/login.js'
import { notificationsPage } from './pages/notifications.js'
import { absenceReviewPage, classStatsPage } from './pages/review.js'
import { sectionsPage } from './pages/sections.js'
import { sessionPage } from './pages/session.js'
import { absencePage, attendPage, myStatsPage } from './pages/student.js'

/** Each role's pages, in menu order: `[hash, menu label, render]`. The first is the start page. */
const PAGES = {
  student: [
    ['attend', 'Confirm attendance', attendPage],
    ['absence', 'Request absence', absencePage],
    ['stats', 'My statistics', myStatsPage],
    ['notifications', 'Notifications', notificationsPage],
  ],
  professor: [
    ['sections', 'Sections', sectionsPage],
    ['session', 'Start attendance', sessionPage],
    ['absences', 'Absence requests', absenceReviewPage],
    ['class-stats', 'Class statistics', classStatsPage],
    ['notifications', 'Notifications', notificationsPage],
  ],
}

const main = document.getElementById('app')
const topbar = document.getElementById('topbar')

/** Clean-up returned by the current page, e.g. stopping a timer. */
let leavePage = () => {}

function show() {
  leavePage()
  leavePage = () => {}
  main.replaceChildren()

  const claims = tokenClaims()
  if (!claims) {
    topbar.hidden = true
    loginPage(main, () => {
      location.hash = ''
      show()
    })
    return
  }

  const pages = PAGES[claims.role]
  const current = pages.find(([hash]) => `#${hash}` === location.hash) ?? pages[0]
  topbar.hidden = false
  document.getElementById('whoami').textContent = claims.role
  document
    .getElementById('nav')
    .replaceChildren(...pages.map(([hash, label]) => el('a', { href: `#${hash}` }, label)))
  const cleanUp = current[2](main)
  if (typeof cleanUp === 'function') leavePage = cleanUp
}

function logOut(message) {
  setToken(null)
  flash(message, Boolean(message))
  show()
}

setUnauthorizedHandler(() => logOut('Your session expired. Please log in again.'))
document.getElementById('logout').addEventListener('click', () => logOut(''))
window.addEventListener('hashchange', () => {
  flash('')
  show()
})
main.addEventListener('reopen', show)
show()
