import {defineType, defineField} from 'sanity'

/**
 * One slide of the home deck. The deck has four fixed slides
 * (Investing, Impact, Ecosystems, Platforms); each uses a different
 * subset of these optional fields. `id` selects which presentation renders.
 */
export const deckSlide = defineType({
  name: 'deckSlide',
  title: 'Slide',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      title: 'Slide id',
      type: 'string',
      description: 'Stable identifier the frontend uses to pick the slide layout.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kicker',
      title: 'Kicker',
      type: 'string',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'animatedTitle',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'copy',
      title: 'Body copy',
      type: 'richInline',
    }),
    defineField({
      name: 'cta',
      title: 'Button',
      type: 'cta',
    }),
    defineField({
      name: 'soiTiles',
      title: 'Sphere tiles',
      type: 'array',
      of: [{type: 'soiTile'}],
    }),
    defineField({
      name: 'coreMark',
      title: 'Sphere core mark',
      type: 'image',
    }),
    defineField({
      name: 'backgroundSlices',
      title: 'Background images',
      type: 'array',
      of: [{type: 'bgSlice'}],
    }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      of: [{type: 'homeStat'}],
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'strips',
      title: 'Platform strips',
      type: 'array',
      of: [{type: 'strip'}],
    }),
  ],
  preview: {
    select: {id: 'id', kicker: 'kicker', lines: 'title.lines'},
    prepare({id, kicker, lines}) {
      const first =
        Array.isArray(lines) && lines[0]
          ? (lines[0].text || [])
              .map((block: {children?: {text?: string}[]}) =>
                (block.children || []).map((child) => child.text || '').join(''),
              )
              .join(' ')
          : ''
      return {
        title: first || id || '(slide)',
        subtitle: kicker || id,
      }
    },
  },
})
