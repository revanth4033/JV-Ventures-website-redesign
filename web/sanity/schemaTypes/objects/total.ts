import {defineType, defineField} from 'sanity'

/** A totals-band entry on a platform (Total = { value, label }). */
export const total = defineType({
  name: 'total',
  title: 'Total',
  type: 'object',
  fields: [
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'value', subtitle: 'label'},
  },
})
