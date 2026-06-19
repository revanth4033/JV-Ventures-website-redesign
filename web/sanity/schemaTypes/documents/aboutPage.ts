import {defineType, defineField} from 'sanity'

/** Singleton: the About page (hero, belief, method, models, ecosystem, GRIDS). */
export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  groups: [
    {name: 'seo', title: 'SEO'},
    {name: 'hero', title: 'Hero'},
    {name: 'belief', title: 'Belief'},
    {name: 'method', title: 'Method'},
    {name: 'models', title: 'Models'},
    {name: 'ecosystem', title: 'Ecosystem'},
    {name: 'grids', title: 'GRIDS'},
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
        defineField({
          name: 'title',
          title: 'Title',
          type: 'animatedTitle',
          validation: (rule) => rule.required(),
        }),
        defineField({name: 'subtitle', title: 'Subtitle', type: 'richInline'}),
        defineField({name: 'intro', title: 'Intro paragraph', type: 'text', rows: 4}),
        defineField({
          name: 'sectorChips',
          title: 'Sector chips',
          type: 'array',
          of: [{type: 'string'}],
        }),
        defineField({name: 'heroImage', title: 'Hero band image', type: 'image', options: {hotspot: true}}),
        defineField({
          name: 'ledger',
          title: 'Ledger stats',
          type: 'array',
          of: [{type: 'stat'}],
        }),
      ],
    }),
    defineField({
      name: 'belief',
      title: 'Belief',
      type: 'object',
      group: 'belief',
      fields: [
        defineField({name: 'actName', title: 'Act label', type: 'string'}),
        defineField({name: 'kicker', title: 'Kicker', type: 'text', rows: 2}),
        defineField({
          name: 'rows',
          title: 'Belief rows',
          type: 'array',
          of: [{type: 'beliefRow'}],
        }),
      ],
    }),
    defineField({
      name: 'method',
      title: 'Method',
      type: 'object',
      group: 'method',
      fields: [
        defineField({name: 'actName', title: 'Act label', type: 'string'}),
        defineField({
          name: 'title',
          title: 'Title',
          type: 'animatedTitle',
          validation: (rule) => rule.required(),
        }),
        defineField({name: 'copy', title: 'Copy', type: 'text', rows: 3}),
        defineField({
          name: 'cards',
          title: 'Method cards',
          type: 'array',
          of: [{type: 'methodCard'}],
        }),
      ],
    }),
    defineField({
      name: 'models',
      title: 'Models',
      type: 'object',
      group: 'models',
      fields: [
        defineField({name: 'actName', title: 'Act label', type: 'string'}),
        defineField({
          name: 'title',
          title: 'Title',
          type: 'animatedTitle',
          validation: (rule) => rule.required(),
        }),
        defineField({name: 'copy', title: 'Copy', type: 'text', rows: 3}),
        defineField({
          name: 'rows',
          title: 'Model rows',
          type: 'array',
          of: [{type: 'modelRow'}],
        }),
      ],
    }),
    defineField({
      name: 'ecosystem',
      title: 'Ecosystem',
      type: 'object',
      group: 'ecosystem',
      fields: [
        defineField({name: 'actName', title: 'Act label', type: 'string'}),
        defineField({
          name: 'title',
          title: 'Title',
          type: 'animatedTitle',
          validation: (rule) => rule.required(),
        }),
        defineField({name: 'copy', title: 'Copy', type: 'text', rows: 3}),
        defineField({
          name: 'tiles',
          title: 'Ecosystem tiles',
          type: 'array',
          of: [{type: 'ecoTile'}],
        }),
      ],
    }),
    defineField({
      name: 'grids',
      title: 'GRIDS',
      type: 'object',
      group: 'grids',
      fields: [
        defineField({name: 'actName', title: 'Act label', type: 'string'}),
        defineField({
          name: 'title',
          title: 'Title',
          type: 'animatedTitle',
          validation: (rule) => rule.required(),
        }),
        defineField({name: 'copy', title: 'Copy', type: 'text', rows: 3}),
        defineField({name: 'morphImage', title: 'Morph image', type: 'image', options: {hotspot: true}}),
        defineField({
          name: 'labelA',
          title: 'Label A (fragmented)',
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'text', title: 'Text', type: 'string'}),
          ],
        }),
        defineField({
          name: 'labelB',
          title: 'Label B (integrated)',
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'text', title: 'Text', type: 'string'}),
          ],
        }),
        defineField({
          name: 'layers',
          title: 'GRIDS layers',
          type: 'array',
          of: [{type: 'gridsLayer'}],
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'About Page'}
    },
  },
})
