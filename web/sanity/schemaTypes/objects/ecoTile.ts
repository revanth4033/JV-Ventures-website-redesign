import {defineType, defineField} from 'sanity'

/**
 * An ecosystem tile on the About page
 * (EcoTile = { image, logo, logoAlt, text, moreLabel, href }).
 */
export const ecoTile = defineType({
  name: 'ecoTile',
  title: 'Ecosystem tile',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
    }),
    defineField({
      name: 'logoAlt',
      title: 'Logo alt / name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'moreLabel',
      title: 'Link label',
      type: 'string',
      initialValue: 'Learn More',
    }),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
    }),
  ],
  preview: {
    select: {title: 'logoAlt', media: 'image'},
  },
})
