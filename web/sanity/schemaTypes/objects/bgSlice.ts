import {defineType, defineField} from 'sanity'

/** A background image slice on the home Impact slide (BgSlice = { image, position? }). */
export const bgSlice = defineType({
  name: 'bgSlice',
  title: 'Background image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'position',
      title: 'Position',
      type: 'string',
      description: 'e.g. center 20%',
    }),
  ],
  preview: {
    select: {media: 'image', subtitle: 'position'},
    prepare({media, subtitle}) {
      return {title: 'Background image', subtitle, media}
    },
  },
})
