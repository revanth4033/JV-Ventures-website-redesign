import {defineType, defineField} from 'sanity'

/**
 * Title that animates line-by-line. Each line carries its own inline rich text
 * and an `accent` flag. Maps to the frontend AnimatedTitle
 * ({ lines: string[]; emphasis?: 'all' | `line:N` }).
 */
export const animatedTitle = defineType({
  name: 'animatedTitle',
  title: 'Title',
  type: 'object',
  fields: [
    defineField({
      name: 'lines',
      title: 'Lines',
      type: 'array',
      of: [{type: 'titleLine'}],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {lines: 'lines'},
    prepare({lines}) {
      const count = Array.isArray(lines) ? lines.length : 0
      const first =
        Array.isArray(lines) && lines[0]
          ? (lines[0].text || [])
              .map((block: {children?: {text?: string}[]}) =>
                (block.children || []).map((child) => child.text || '').join(''),
              )
              .join(' ')
          : ''
      return {
        title: first || '(untitled)',
        subtitle: `${count} line${count === 1 ? '' : 's'}`,
      }
    },
  },
})
