import {defineType, defineField} from 'sanity'

/** A single entry inside a navigation dropdown. */
export const navDropItem = defineType({
  name: 'navDropItem',
  title: 'Dropdown item',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sector',
      title: 'Sector',
      type: 'string',
    }),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'sector'},
  },
})
