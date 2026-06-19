import {defineType, defineField} from 'sanity'

/** A belief row on the About page (BeliefRow = { num, line, note }). */
export const beliefRow = defineType({
  name: 'beliefRow',
  title: 'Belief row',
  type: 'object',
  fields: [
    defineField({
      name: 'num',
      title: 'Number',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'line',
      title: 'Headline',
      type: 'richInline',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {num: 'num', line: 'line'},
    prepare({num, line}) {
      const text = Array.isArray(line)
        ? line
            .map((block: {children?: {text?: string}[]}) =>
              (block.children || []).map((child) => child.text || '').join(''),
            )
            .join(' ')
        : ''
      return {title: text || '(empty)', subtitle: num}
    },
  },
})
