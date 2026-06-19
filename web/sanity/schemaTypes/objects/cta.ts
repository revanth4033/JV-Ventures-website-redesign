import {defineType, defineField} from 'sanity'

/** A simple call-to-action button (label + link). */
export const cta = defineType({
  name: 'cta',
  title: 'Button',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
    }),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
      description: 'e.g. /about, /platform/powerx, #contact',
    }),
  ],
  preview: {
    select: {title: 'label', subtitle: 'href'},
  },
})
