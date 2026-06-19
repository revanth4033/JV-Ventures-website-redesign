import {defineType, defineField} from 'sanity'

/**
 * A method card on the About page (MethodCard = { stage, icon, title, desc }).
 * `title` is inline rich text that may contain <br> line breaks.
 */
export const methodCard = defineType({
  name: 'methodCard',
  title: 'Method card',
  type: 'object',
  fields: [
    defineField({
      name: 'stage',
      title: 'Stage label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'image',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'richInline',
      description: 'May contain line breaks.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'desc',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {stage: 'stage', title: 'title', media: 'icon'},
    prepare({stage, title, media}) {
      const text = Array.isArray(title)
        ? title
            .map((block: {children?: {text?: string}[]}) =>
              (block.children || []).map((child) => child.text || '').join(''),
            )
            .join(' ')
        : ''
      return {title: text || stage, subtitle: stage, media}
    },
  },
})
