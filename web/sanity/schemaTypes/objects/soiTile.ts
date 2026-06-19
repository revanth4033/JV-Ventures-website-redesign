import {defineType, defineField} from 'sanity'

/** A sphere tile on the home Investing slide (SoiTile = { label, image }). */
export const soiTile = defineType({
  name: 'soiTile',
  title: 'Sphere tile',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'label', media: 'image'},
  },
})
