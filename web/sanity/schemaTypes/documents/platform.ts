import {defineType, defineField} from 'sanity'

/** A platform: identity, hero, totals band and venture categories. */
export const platform = defineType({
  name: 'platform',
  title: 'Platform',
  type: 'document',
  groups: [
    {name: 'identity', title: 'Identity'},
    {name: 'hero', title: 'Hero'},
    {name: 'totals', title: 'Totals band'},
    {name: 'ventures', title: 'Ventures'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Platform name',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'identity',
      options: {source: 'name', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sector',
      title: 'Sector',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'wordmark',
      title: 'Wordmark',
      type: 'image',
      group: 'hero',
    }),
    defineField({
      name: 'hero',
      title: 'Hero / poster image',
      type: 'image',
      options: {hotspot: true},
      group: 'hero',
    }),
    defineField({
      name: 'video',
      title: 'Hero video (mp4)',
      type: 'file',
      options: {accept: 'video/mp4'},
      group: 'hero',
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'text',
      rows: 2,
      group: 'hero',
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'text',
      rows: 4,
      group: 'hero',
    }),
    defineField({
      name: 'totals',
      title: 'Totals',
      type: 'array',
      of: [{type: 'total'}],
      group: 'totals',
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{type: 'category'}],
      group: 'ventures',
    }),
  ],
  orderings: [
    {
      title: 'Display order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
  preview: {
    select: {title: 'name', subtitle: 'sector', order: 'order', media: 'wordmark'},
    prepare({title, subtitle, order, media}) {
      return {
        title,
        subtitle: [order != null ? `#${order}` : null, subtitle].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
