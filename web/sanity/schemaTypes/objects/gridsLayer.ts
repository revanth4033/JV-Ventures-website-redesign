import {defineType, defineField} from 'sanity'

/** A GRIDS layer on the About page (GridsLayer = { num, icon, title, subtitle }). */
export const gridsLayer = defineType({
  name: 'gridsLayer',
  title: 'GRIDS layer',
  type: 'object',
  fields: [
    defineField({
      name: 'num',
      title: 'Number',
      type: 'string',
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'image',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'subtitle', media: 'icon'},
  },
})
