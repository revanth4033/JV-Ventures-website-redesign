import {defineType, defineField} from 'sanity'

/** A venture within a platform category (Venture = { name, logo, photo, desc, metrics }). */
export const venture = defineType({
  name: 'venture',
  title: 'Venture',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo (optional)',
      type: 'image',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'desc',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'metrics',
      title: 'Metrics',
      type: 'array',
      of: [{type: 'metric'}],
    }),
  ],
  preview: {
    select: {title: 'name', media: 'photo'},
  },
})
