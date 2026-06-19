import {defineType, defineField} from 'sanity'

/** Singleton: the home page (SEO + the deck of slides). */
export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  groups: [
    {name: 'seo', title: 'SEO'},
    {name: 'deck', title: 'Deck'},
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
      name: 'deck',
      title: 'Deck',
      type: 'object',
      group: 'deck',
      fields: [
        defineField({
          name: 'deckActName',
          title: 'Deck label',
          type: 'string',
        }),
        defineField({
          name: 'railChapters',
          title: 'Rail chapter labels',
          type: 'array',
          of: [{type: 'string'}],
          description: 'One per slide, in order.',
        }),
        defineField({
          name: 'slides',
          title: 'Slides',
          type: 'array',
          of: [{type: 'deckSlide'}],
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Home Page'}
    },
  },
})
