import {defineType} from 'sanity'

/**
 * Inline rich text used for short, trusted copy that may carry emphasis.
 * Maps to the prototype's <strong>, <em> and <em class="soi"> spans plus
 * <br> line breaks. A single block, no block styles or lists — the public
 * site renders this inline.
 */
export const richInline = defineType({
  name: 'richInline',
  title: 'Rich text',
  type: 'array',
  of: [
    {
      type: 'block',
      // No headings/quotes — inline copy only.
      styles: [{title: 'Normal', value: 'normal'}],
      lists: [],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'SOI', value: 'soi'},
        ],
        annotations: [],
      },
    },
  ],
})
