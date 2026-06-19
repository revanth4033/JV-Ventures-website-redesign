import {defineType, defineField} from 'sanity'

/** Singleton: the Team page (hero, founders, roster groups). */
export const teamPage = defineType({
  name: 'teamPage',
  title: 'Team Page',
  type: 'document',
  groups: [
    {name: 'seo', title: 'SEO'},
    {name: 'hero', title: 'Hero'},
    {name: 'founders', title: 'Founders'},
    {name: 'roster', title: 'Roster'},
  ],
  fields: [
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      group: 'hero',
      fields: [
        defineField({name: 'actName', title: 'Act label', type: 'string'}),
        defineField({name: 'kicker', title: 'Kicker', type: 'string'}),
        defineField({
          name: 'title',
          title: 'Title',
          type: 'animatedTitle',
          validation: (rule) => rule.required(),
        }),
        defineField({name: 'intro', title: 'Intro', type: 'text', rows: 4}),
        defineField({
          name: 'stats',
          title: 'Hero stats',
          type: 'array',
          of: [{type: 'homeStat'}],
        }),
      ],
    }),
    defineField({
      name: 'foundersTitle',
      title: 'Founders section heading',
      type: 'string',
      group: 'founders',
    }),
    defineField({
      name: 'founders',
      title: 'Co-founders',
      type: 'array',
      of: [{type: 'teamMember'}],
      group: 'founders',
    }),
    defineField({
      name: 'rosterTitle',
      title: 'Roster section heading',
      type: 'string',
      group: 'roster',
    }),
    defineField({
      name: 'rosterCopy',
      title: 'Roster copy',
      type: 'text',
      rows: 3,
      group: 'roster',
    }),
    defineField({
      name: 'groups',
      title: 'Venture groups',
      type: 'array',
      of: [{type: 'teamGroup'}],
      group: 'roster',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Team Page'}
    },
  },
})
