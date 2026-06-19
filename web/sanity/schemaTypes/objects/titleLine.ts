import {defineType, defineField} from 'sanity'

/**
 * One line of an animated title. `text` is a single inline Portable Text block
 * (decorators strong / em / soi). `accent` flags the line as emphasised
 * (italic/red) — this maps to the AnimatedTitle `emphasis` selector.
 */
export const titleLine = defineType({
  name: 'titleLine',
  title: 'Line',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
      type: 'richInline',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'accent',
      title: 'Emphasise (italic / red)',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {blocks: 'text', accent: 'accent'},
    prepare({blocks, accent}) {
      const text = Array.isArray(blocks)
        ? blocks
            .map((block: {children?: {text?: string}[]}) =>
              (block.children || []).map((child) => child.text || '').join(''),
            )
            .join(' ')
        : ''
      return {
        title: text || '(empty line)',
        subtitle: accent ? 'Emphasised' : undefined,
      }
    },
  },
})
