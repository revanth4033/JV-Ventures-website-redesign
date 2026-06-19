import {defineType, defineField} from 'sanity'

/** A category grouping ventures within a platform (Category = { label, ventures }). */
export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Category label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'ventures',
      title: 'Ventures',
      type: 'array',
      of: [{type: 'venture'}],
    }),
  ],
  preview: {
    select: {label: 'label', ventures: 'ventures'},
    prepare({label, ventures}) {
      const count = Array.isArray(ventures) ? ventures.length : 0
      return {title: label, subtitle: `${count} venture${count === 1 ? '' : 's'}`}
    },
  },
})
