import {defineType, defineField} from 'sanity'

/**
 * A counter stat used on the home Impact slide and the team/hero bands
 * (HomeStat = { value, suffix?, label }).
 */
export const homeStat = defineType({
  name: 'homeStat',
  title: 'Stat',
  type: 'object',
  fields: [
    defineField({
      name: 'value',
      title: 'Number',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'suffix',
      title: 'Suffix',
      type: 'string',
      description: 'e.g. +',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {value: 'value', suffix: 'suffix', label: 'label'},
    prepare({value, suffix, label}) {
      return {title: `${value ?? ''}${suffix || ''}`, subtitle: label}
    },
  },
})
