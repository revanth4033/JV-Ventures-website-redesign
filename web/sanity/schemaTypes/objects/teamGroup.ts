import {defineType, defineField} from 'sanity'

/** A venture roster group (TeamGroup = { venture, members }). */
export const teamGroup = defineType({
  name: 'teamGroup',
  title: 'Venture group',
  type: 'object',
  fields: [
    defineField({
      name: 'venture',
      title: 'Venture name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'members',
      title: 'Members',
      type: 'array',
      of: [{type: 'teamMember'}],
    }),
  ],
  preview: {
    select: {venture: 'venture', members: 'members'},
    prepare({venture, members}) {
      const count = Array.isArray(members) ? members.length : 0
      return {title: venture, subtitle: `${count} member${count === 1 ? '' : 's'}`}
    },
  },
})
