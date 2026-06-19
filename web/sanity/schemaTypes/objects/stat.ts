import {defineType, defineField} from 'sanity'

/** A ledger / animated counter stat (About hero ledger; also shape of LedgerItem). */
export const stat = defineType({
  name: 'stat',
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
      name: 'prefix',
      title: 'Prefix',
      type: 'string',
    }),
    defineField({
      name: 'suffix',
      title: 'Suffix',
      type: 'string',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'plain',
      title: 'No thousands separator (for years)',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {value: 'value', prefix: 'prefix', suffix: 'suffix', label: 'label'},
    prepare({value, prefix, suffix, label}) {
      return {
        title: `${prefix || ''}${value ?? ''}${suffix || ''}`,
        subtitle: label,
      }
    },
  },
})
