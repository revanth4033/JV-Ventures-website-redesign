import {defineType, defineField} from 'sanity'

/** A top-level navigation menu item, optionally with a dropdown. */
export const navItem = defineType({
  name: 'navItem',
  title: 'Menu item',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'external',
      title: 'Open in a new tab',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'cta',
      title: 'Show as an outlined button',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'dropdown',
      title: 'Dropdown items',
      type: 'array',
      of: [{type: 'navDropItem'}],
    }),
  ],
  preview: {
    select: {title: 'label', subtitle: 'href'},
  },
})
