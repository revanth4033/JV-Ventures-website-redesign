import {defineType, defineField} from 'sanity'

/**
 * One line of the closing quote. Wraps a single inline Portable Text value so
 * that closingQuote.lines can be an array (a Sanity array cannot hold another
 * array directly). Maps to one entry of SiteSettings.closingQuote.lines[].
 */
export const quoteLine = defineType({
  name: 'quoteLine',
  title: 'Quote line',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Line',
      type: 'richInline',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {text: 'text'},
    prepare({text}) {
      const value = Array.isArray(text)
        ? text
            .map((block: {children?: {text?: string}[]}) =>
              (block.children || []).map((child) => child.text || '').join(''),
            )
            .join(' ')
        : ''
      return {title: value || '(empty line)'}
    },
  },
})
