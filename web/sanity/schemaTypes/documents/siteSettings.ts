import {defineType, defineField} from 'sanity'

/** Singleton: global site settings (logo, nav, closing block, footer). */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    {name: 'logo', title: 'Logo'},
    {name: 'navigation', title: 'Navigation'},
    {name: 'closing', title: 'Closing block'},
    {name: 'footer', title: 'Footer'},
  ],
  fields: [
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'imageWithAlt',
      group: 'logo',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'nav',
      title: 'Menu items',
      type: 'array',
      of: [{type: 'navItem'}],
      group: 'navigation',
    }),
    defineField({
      name: 'closingQuote',
      title: 'Closing quote',
      type: 'object',
      group: 'closing',
      description: 'One Portable Text line per row. Use the toolbar to emphasise words.',
      fields: [
        defineField({
          name: 'lines',
          title: 'Lines',
          type: 'array',
          of: [{type: 'quoteLine'}],
        }),
      ],
    }),
    defineField({
      name: 'bridgeImage',
      title: 'Bridge image',
      type: 'imageWithAlt',
      group: 'closing',
    }),
    defineField({
      name: 'footer',
      title: 'Footer',
      type: 'object',
      group: 'footer',
      fields: [
        defineField({
          name: 'locations',
          title: 'Locations line',
          type: 'string',
        }),
        defineField({
          name: 'links',
          title: 'Footer links',
          type: 'array',
          of: [{type: 'link'}],
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Site Settings'}
    },
  },
})
