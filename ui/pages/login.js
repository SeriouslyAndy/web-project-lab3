/** Login, plus the development-only registration the API offers. */
import { api, errorText, setToken } from '../api.js'
import { el, field, flash, form } from '../dom.js'

/** Renders both forms. `onLoggedIn` runs once a token has been stored. */
export function loginPage(container, onLoggedIn) {
  const login = form(
    async ({ email, password }) => {
      try {
        const { access_token: accessToken } = await api.login(email, password)
        setToken(accessToken)
        flash('')
        onLoggedIn()
      } catch (error) {
        flash(errorText(error), true)
      }
    },
    field('Email', { name: 'email', type: 'email', required: true, autocomplete: 'username' }),
    field('Password', {
      name: 'password',
      type: 'password',
      required: true,
      autocomplete: 'current-password',
    }),
    el('button', { type: 'submit' }, 'Log in'),
  )

  container.append(
    el('section', {}, el('h1', {}, 'Log in'), login),
    el('section', {}, el('h2', {}, 'Register (development only)'), registerForm()),
  )
}

/** Shows the new user's id, because a professor needs a student's id to enroll them. */
function registerForm() {
  const roles = el(
    'select',
    { name: 'role' },
    el('option', { value: 'student' }, 'Student'),
    el('option', { value: 'professor' }, 'Professor'),
  )
  return form(
    async (user, node) => {
      try {
        const created = await api.register(user)
        node.reset()
        flash(`Registered ${created.email}. Your user id is ${created.id}. You can log in now.`)
      } catch (error) {
        flash(errorText(error), true)
      }
    },
    field('Email', { name: 'email', type: 'email', required: true }),
    field('Password (at least 12 characters)', {
      name: 'password',
      type: 'password',
      required: true,
      minlength: 12,
      autocomplete: 'new-password',
    }),
    field('First name', { name: 'first_name', required: true, maxlength: 100 }),
    field('Last name', { name: 'last_name', required: true, maxlength: 100 }),
    el('label', {}, 'Role', roles),
    el('button', { type: 'submit' }, 'Register'),
  )
}
