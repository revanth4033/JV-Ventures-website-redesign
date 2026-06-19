import {defineType, defineField} from 'sanity'

/**
 * A platform strip on the home Platforms slide.
 * Strip = { tab, logo, logoAlt, image, statStrong, statSpan, desc, href }.
 */
export const strip = defineType({
  name: 'strip',
  title: 'Platform strip',
  type: 'object',
  fields: [
    defineField({
      name: 'tab',
      title: 'Sector tab',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
    }),
    defineField({
      name: 'logoAlt',
      title: 'Logo alt text',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'Background image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'statStrong',
      title: 'Stat (bold)',
      type: 'string',
    }),
    defineField({
      name: 'statSpan',
      title: 'Stat (caption)',
      type: 'string',
    }),
    defineField({
      name: 'desc',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
    }),
  ],
  preview: {
    select: {title: 'tab', subtitle: 'statStrong', media: 'logo'},
  },
})
