import {defineType, defineField} from 'sanity'

/** Singleton: the Contact page (hero, details, offices). */
export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact Page',
  type: 'document',
  groups: [
    {name: 'seo', title: 'SEO'},
    {name: 'hero', title: 'Hero'},
    {name: 'details', title: 'Details'},
    {name: 'offices', title: 'Offices'},
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
      ],
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'details',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'enquiryTypes',
      title: 'Enquiry types',
      type: 'array',
      of: [{type: 'string'}],
      group: 'details',
      description: 'One per line.',
    }),
    defineField({
      name: 'presence',
      title: 'Presence line',
      type: 'string',
      group: 'details',
    }),
    defineField({
      name: 'formIntro',
      title: 'Form intro',
      type: 'text',
      rows: 3,
      group: 'details',
    }),
    defineField({
      name: 'offices',
      title: 'Offices',
      type: 'array',
      of: [{type: 'office'}],
      group: 'offices',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Contact Page'}
    },
  },
})
