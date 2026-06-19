import {defineType, defineField} from 'sanity'

/** A contact office (Office = { city, region, address }). */
export const office = defineType({
  name: 'office',
  title: 'Office',
  type: 'object',
  fields: [
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'region',
      title: 'Region',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {title: 'city', subtitle: 'region'},
  },
})
