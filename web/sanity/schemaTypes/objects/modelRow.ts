import {defineType, defineField} from 'sanity'

/** A model row on the About page (ModelRow = { num, icon, image, title, desc }). */
export const modelRow = defineType({
  name: 'modelRow',
  title: 'Model row',
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
      name: 'image',
      title: 'Stage image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
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
    select: {title: 'title', subtitle: 'num', media: 'image'},
  },
})
