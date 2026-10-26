/** Professor: create class sections and enroll students. */
import { api, errorText } from '../api.js'
import { el, field, flash, form, table } from '../dom.js'

// FIXME: the API has no endpoint to list a professor's sections, so only the sections created
// since the last login are remembered (in memory) and offered as suggestions.
const knownSections = []

/** A section id input that suggests the sections created this session. */
export function sectionField(label = 'Section id') {
  const options = knownSections.map((section) => el('option', { value: section.id }, section.name))
  return el(
    'label',
    {},
    label,
    el('input', { name: 'section_id', required: true, list: 'known-sections' }),
    el('datalist', { id: 'known-sections' }, options),
  )
}

export function sectionsPage(container) {
  const create = form(
    async ({ name }, node) => {
      try {
        knownSections.push(await api.createSection(name))
        node.reset()
        flash(`Section "${name}" created.`)
        rerender(container)
      } catch (error) {
        flash(errorText(error), true)
      }
    },
    field('Name', { name: 'name', required: true, maxlength: 200 }),
    el('button', { type: 'submit' }, 'Create section'),
  )

  const enroll = form(
    async ({ section_id: sectionId, student_id: studentId }, node) => {
      try {
        await api.enroll(sectionId, studentId)
        node.reset()
        flash('Student enrolled.')
      } catch (error) {
        flash(errorText(error), true)
      }
    },
    sectionField(),
    field('Student id', { name: 'student_id', required: true }),
    el('button', { type: 'submit' }, 'Enroll student'),
  )

  const rows = knownSections.map((section) => [section.name, el('code', {}, section.id)])
  container.append(
    el('h1', {}, 'Class sections'),
    rows.length ? table(['Name', 'Id'], rows) : el('p', {}, 'No sections created yet.'),
    el('section', {}, el('h2', {}, 'New section'), create),
    el('section', {}, el('h2', {}, 'Enroll a student'), enroll),
  )
}

function rerender(container) {
  container.replaceChildren()
  sectionsPage(container)
}
