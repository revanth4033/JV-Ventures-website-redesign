import type { FieldDef } from './form/types'

const cta = (name = 'cta', label = 'Button'): FieldDef => ({
  type: 'group',
  name,
  label,
  fields: [
    {
      type: 'row',
      fields: [
        { type: 'text', name: 'label', label: 'Label' },
        { type: 'text', name: 'href', label: 'Link', hint: 'e.g. /about, /platform/powerx, #contact' },
      ],
    },
  ],
})
const titleField = (name = 'title'): FieldDef => ({ type: 'lines', name, label: 'Title' })

/* ---------------- Site Settings ---------------- */
export const siteSettingsSchema: FieldDef[] = [
  {
    type: 'section', name: 'logo', label: 'Logo',
    fields: [
      { type: 'image', name: 'logo.src', label: 'Image' },
      { type: 'text', name: 'logo.alt', label: 'Alt text' },
    ],
  },
  {
    type: 'section', name: 'navigation', label: 'Navigation',
    fields: [
      {
        type: 'array', name: 'nav', label: 'Menu items', itemTitleKey: 'label',
        newItem: () => ({ label: '', href: '', cta: false, dropdown: [] }),
        fields: [
          { type: 'row', fields: [
            { type: 'text', name: 'label', label: 'Label' },
            { type: 'text', name: 'href', label: 'Link' },
          ] },
          { type: 'checkbox', name: 'cta', label: 'Show as an outlined button' },
          {
            type: 'array', name: 'dropdown', label: 'Dropdown items', flat: true,
            newItem: () => ({ name: '', sector: '', href: '' }),
            fields: [
              { type: 'row', fields: [
                { type: 'text', name: 'name', label: 'Name' },
                { type: 'text', name: 'sector', label: 'Sector' },
                { type: 'text', name: 'href', label: 'Link' },
              ] },
            ],
          },
        ],
      },
    ],
  },
  {
    type: 'section', name: 'footer', label: 'Footer',
    fields: [
      { type: 'text', name: 'footer.locations', label: 'Locations line' },
      {
        type: 'array', name: 'footer.links', label: 'Footer links', flat: true,
        newItem: () => ({ label: '', href: '', external: false }),
        fields: [
          { type: 'row', fields: [
            { type: 'text', name: 'label', label: 'Label' },
            { type: 'text', name: 'href', label: 'Link' },
          ] },
          { type: 'checkbox', name: 'external', label: 'Open in a new tab' },
        ],
      },
    ],
  },
  {
    type: 'section', name: 'closing', label: 'Closing block',
    fields: [
      { type: 'richList', name: 'closingQuote.lines', label: 'Closing quote', hint: 'One line per row. Use the toolbar to emphasise words.' },
      { type: 'image', name: 'bridgeImage.src', label: 'Bridge image' },
      { type: 'text', name: 'bridgeImage.alt', label: 'Bridge image alt text' },
    ],
  },
]

/* ---------------- Home Page (4 fixed slides) ---------------- */
export const homeSchema: FieldDef[] = [
  {
    type: 'group', name: 'deck', label: 'Deck settings',
    fields: [
      { type: 'text', name: 'deckActName', label: 'Deck label' },
      { type: 'stringList', name: 'railChapters', label: 'Rail chapter labels', hint: 'One per slide, in order.' },
    ],
  },
  {
    type: 'group', name: 'deck.slides.0', label: 'Slide 1 — Investing',
    fields: [
      { type: 'text', name: 'kicker', label: 'Kicker' },
      titleField(),
      { type: 'rich', name: 'copy', label: 'Body copy' },
      cta(),
      { type: 'image', name: 'coreMark', label: 'Sphere core mark' },
      {
        type: 'array', name: 'soiTiles', label: 'Sphere tiles', itemTitleKey: 'label',
        newItem: () => ({ label: '', image: '' }),
        fields: [{ type: 'text', name: 'label', label: 'Label' }, { type: 'image', name: 'image', label: 'Image' }],
      },
    ],
  },
  {
    type: 'group', name: 'deck.slides.1', label: 'Slide 2 — Impact',
    fields: [
      { type: 'text', name: 'kicker', label: 'Kicker' },
      titleField(),
      {
        type: 'array', name: 'backgroundSlices', label: 'Background images',
        newItem: () => ({ image: '', position: '' }),
        fields: [{ type: 'image', name: 'image', label: 'Image' }, { type: 'text', name: 'position', label: 'Position', hint: 'e.g. center 20%' }],
      },
      {
        type: 'array', name: 'stats', label: 'Stats', flat: true,
        newItem: () => ({ value: 0, suffix: '', label: '' }),
        fields: [
          { type: 'row', fields: [
            { type: 'number', name: 'value', label: 'Number' },
            { type: 'text', name: 'suffix', label: 'Suffix', hint: 'e.g. +' },
          ] },
          { type: 'text', name: 'label', label: 'Label' },
        ],
      },
    ],
  },
  {
    type: 'group', name: 'deck.slides.2', label: 'Slide 3 — Ecosystems',
    fields: [
      { type: 'text', name: 'kicker', label: 'Kicker' },
      titleField(),
      { type: 'rich', name: 'copy', label: 'Body copy' },
      cta(),
      { type: 'image', name: 'backgroundImage', label: 'Background image' },
    ],
  },
  {
    type: 'group', name: 'deck.slides.3', label: 'Slide 4 — Platforms',
    fields: [
      { type: 'text', name: 'kicker', label: 'Kicker' },
      titleField(),
      { type: 'rich', name: 'copy', label: 'Body copy' },
      cta(),
      {
        type: 'array', name: 'strips', label: 'Platform strips', itemTitleKey: 'tab',
        newItem: () => ({ tab: '', logo: '', image: '', statStrong: '', statSpan: '', desc: '', href: '' }),
        fields: [
          { type: 'text', name: 'tab', label: 'Sector tab' },
          { type: 'row', fields: [
            { type: 'image', name: 'logo', label: 'Logo' },
            { type: 'image', name: 'image', label: 'Background image' },
          ] },
          { type: 'row', fields: [
            { type: 'text', name: 'statStrong', label: 'Stat (bold)' },
            { type: 'text', name: 'statSpan', label: 'Stat (caption)' },
          ] },
          { type: 'textarea', name: 'desc', label: 'Description' },
          { type: 'text', name: 'href', label: 'Link' },
        ],
      },
    ],
  },
]

/* ---------------- About Page ---------------- */
export const aboutSchema: FieldDef[] = [
  {
    type: 'group', name: 'hero', label: 'Hero',
    fields: [
      { type: 'text', name: 'actName', label: 'Act label' },
      titleField(),
      { type: 'rich', name: 'subtitle', label: 'Subtitle' },
      { type: 'textarea', name: 'intro', label: 'Intro paragraph' },
      { type: 'stringList', name: 'sectorChips', label: 'Sector chips' },
      { type: 'image', name: 'heroImage', label: 'Hero band image' },
      {
        type: 'array', name: 'ledger', label: 'Ledger stats', flat: true,
        newItem: () => ({ value: 0, prefix: '', suffix: '', plain: false, label: '' }),
        fields: [
          { type: 'row', fields: [
            { type: 'number', name: 'value', label: 'Number' },
            { type: 'text', name: 'prefix', label: 'Prefix' },
            { type: 'text', name: 'suffix', label: 'Suffix' },
          ] },
          { type: 'text', name: 'label', label: 'Label' },
          { type: 'checkbox', name: 'plain', label: 'No thousands separator (for years)' },
        ],
      },
    ],
  },
  {
    type: 'group', name: 'belief', label: 'Belief',
    fields: [
      { type: 'text', name: 'actName', label: 'Act label' },
      { type: 'textarea', name: 'kicker', label: 'Kicker' },
      {
        type: 'array', name: 'rows', label: 'Belief rows', itemTitleKey: 'num',
        newItem: () => ({ num: '', line: '', note: '' }),
        fields: [
          { type: 'text', name: 'num', label: 'Number' },
          { type: 'rich', name: 'line', label: 'Headline' },
          { type: 'textarea', name: 'note', label: 'Note' },
        ],
      },
    ],
  },
  {
    type: 'group', name: 'method', label: 'Method',
    fields: [
      { type: 'text', name: 'actName', label: 'Act label' },
      titleField(),
      { type: 'textarea', name: 'copy', label: 'Copy' },
      {
        type: 'array', name: 'cards', label: 'Method cards', itemTitleKey: 'stage',
        newItem: () => ({ stage: '', icon: '', title: '', desc: '' }),
        fields: [
          { type: 'row', fields: [
            { type: 'text', name: 'stage', label: 'Stage label' },
            { type: 'image', name: 'icon', label: 'Icon' },
          ] },
          { type: 'rich', name: 'title', label: 'Title', multiline: true, hint: 'Press Enter for a line break.' },
          { type: 'textarea', name: 'desc', label: 'Description' },
        ],
      },
    ],
  },
  {
    type: 'group', name: 'models', label: 'Models',
    fields: [
      { type: 'text', name: 'actName', label: 'Act label' },
      titleField(),
      { type: 'textarea', name: 'copy', label: 'Copy' },
      {
        type: 'array', name: 'rows', label: 'Model rows', itemTitleKey: 'title',
        newItem: () => ({ num: '', icon: '', image: '', title: '', desc: '' }),
        fields: [
          { type: 'text', name: 'title', label: 'Title' },
          { type: 'row', fields: [
            { type: 'text', name: 'num', label: 'Number' },
            { type: 'image', name: 'icon', label: 'Icon' },
          ] },
          { type: 'image', name: 'image', label: 'Stage image' },
          { type: 'textarea', name: 'desc', label: 'Description' },
        ],
      },
    ],
  },
  {
    type: 'group', name: 'ecosystem', label: 'Ecosystem',
    fields: [
      { type: 'text', name: 'actName', label: 'Act label' },
      titleField(),
      { type: 'textarea', name: 'copy', label: 'Copy' },
      {
        type: 'array', name: 'tiles', label: 'Ecosystem tiles', itemTitleKey: 'logoAlt',
        newItem: () => ({ image: '', logo: '', logoAlt: '', text: '', moreLabel: 'Learn More', href: '' }),
        fields: [
          { type: 'row', fields: [
            { type: 'image', name: 'image', label: 'Image' },
            { type: 'image', name: 'logo', label: 'Logo' },
          ] },
          { type: 'text', name: 'logoAlt', label: 'Logo alt / name' },
          { type: 'textarea', name: 'text', label: 'Text' },
          { type: 'row', fields: [
            { type: 'text', name: 'moreLabel', label: 'Link label' },
            { type: 'text', name: 'href', label: 'Link' },
          ] },
        ],
      },
    ],
  },
  {
    type: 'group', name: 'grids', label: 'GRIDS',
    fields: [
      { type: 'text', name: 'actName', label: 'Act label' },
      titleField(),
      { type: 'textarea', name: 'copy', label: 'Copy' },
      { type: 'image', name: 'morphImage', label: 'Morph image' },
      { type: 'group', name: 'labelA', label: 'Label A (fragmented)', fields: [{ type: 'row', fields: [{ type: 'text', name: 'title', label: 'Title' }, { type: 'text', name: 'text', label: 'Text' }] }] },
      { type: 'group', name: 'labelB', label: 'Label B (integrated)', fields: [{ type: 'row', fields: [{ type: 'text', name: 'title', label: 'Title' }, { type: 'text', name: 'text', label: 'Text' }] }] },
      {
        type: 'array', name: 'layers', label: 'GRIDS layers', itemTitleKey: 'title',
        newItem: () => ({ num: '', icon: '', title: '', subtitle: '' }),
        fields: [
          { type: 'row', fields: [
            { type: 'text', name: 'num', label: 'Number' },
            { type: 'image', name: 'icon', label: 'Icon' },
          ] },
          { type: 'text', name: 'title', label: 'Title' },
          { type: 'text', name: 'subtitle', label: 'Subtitle' },
        ],
      },
    ],
  },
]

/* ---------------- Platform ---------------- */
export const platformSchema: FieldDef[] = [
  {
    type: 'section', name: 'identity', label: 'Identity',
    fields: [
      { type: 'row', fields: [
        { type: 'text', name: 'name', label: 'Platform name' },
        { type: 'text', name: 'sector', label: 'Sector' },
      ] },
      { type: 'number', name: 'order', label: 'Display order' },
    ],
  },
  {
    type: 'section', name: 'hero', label: 'Hero',
    fields: [
      { type: 'row', fields: [
        { type: 'image', name: 'wordmark', label: 'Wordmark' },
        { type: 'image', name: 'hero', label: 'Hero / poster image' },
      ] },
      { type: 'image', name: 'video', label: 'Hero video (mp4)' },
      { type: 'textarea', name: 'tagline', label: 'Tagline' },
      { type: 'textarea', name: 'intro', label: 'Intro' },
    ],
  },
  {
    type: 'section', name: 'totals', label: 'Totals band',
    fields: [
      {
        type: 'array', name: 'totals', label: 'Totals', flat: true,
        newItem: () => ({ value: '', label: '' }),
        fields: [{ type: 'row', fields: [{ type: 'text', name: 'value', label: 'Value' }, { type: 'text', name: 'label', label: 'Label' }] }],
      },
    ],
  },
  {
    type: 'section', name: 'ventures', label: 'Ventures',
    fields: [
      {
        type: 'array', name: 'categories', label: 'Categories', itemTitleKey: 'label',
        newItem: () => ({ label: '', ventures: [] }),
        fields: [
          { type: 'text', name: 'label', label: 'Category label' },
          {
            type: 'array', name: 'ventures', label: 'Ventures', itemTitleKey: 'name',
            newItem: () => ({ name: '', logo: '', photo: '', desc: '', metrics: [] }),
            fields: [
              { type: 'text', name: 'name', label: 'Name' },
              { type: 'row', fields: [
                { type: 'image', name: 'logo', label: 'Logo (optional)' },
                { type: 'image', name: 'photo', label: 'Photo' },
              ] },
              { type: 'textarea', name: 'desc', label: 'Description' },
              {
                type: 'array', name: 'metrics', label: 'Metrics', flat: true,
                newItem: () => ({ value: '', label: '' }),
                fields: [{ type: 'row', fields: [{ type: 'text', name: 'value', label: 'Value' }, { type: 'text', name: 'label', label: 'Label' }] }],
              },
            ],
          },
        ],
      },
    ],
  },
]

/* ---------------- Team ---------------- */
const memberFields: FieldDef[] = [
  { type: 'row', fields: [
    { type: 'text', name: 'name', label: 'Name' },
    { type: 'text', name: 'role', label: 'Role' },
  ] },
  { type: 'image', name: 'photo', label: 'Photo' },
  { type: 'textarea', name: 'bio', label: 'Bio' },
  { type: 'stringList', name: 'highlights', label: 'Highlights', hint: 'One per line (e.g. “20+ years”).' },
]

export const teamSchema: FieldDef[] = [
  {
    type: 'group', name: 'hero', label: 'Hero',
    fields: [
      { type: 'text', name: 'actName', label: 'Act label' },
      { type: 'text', name: 'kicker', label: 'Kicker' },
      titleField(),
      { type: 'textarea', name: 'intro', label: 'Intro' },
      {
        type: 'array', name: 'stats', label: 'Hero stats', flat: true,
        newItem: () => ({ value: 0, label: '' }),
        fields: [{ type: 'row', fields: [{ type: 'number', name: 'value', label: 'Number' }, { type: 'text', name: 'label', label: 'Label' }] }],
      },
    ],
  },
  {
    type: 'section', name: 'founders', label: 'Founders',
    fields: [
      { type: 'text', name: 'foundersTitle', label: 'Section heading' },
      {
        type: 'array', name: 'founders', label: 'Co-founders', itemTitleKey: 'name',
        newItem: () => ({ name: '', role: '', bio: '', photo: '', highlights: [] }),
        fields: memberFields,
      },
    ],
  },
  {
    type: 'section', name: 'roster', label: 'Roster',
    fields: [
      { type: 'text', name: 'rosterTitle', label: 'Section heading' },
      { type: 'textarea', name: 'rosterCopy', label: 'Copy' },
      {
        type: 'array', name: 'groups', label: 'Venture groups', itemTitleKey: 'venture',
        newItem: () => ({ venture: '', members: [] }),
        fields: [
          { type: 'text', name: 'venture', label: 'Venture name' },
          {
            type: 'array', name: 'members', label: 'Members', itemTitleKey: 'name',
            newItem: () => ({ name: '', role: '', bio: '', photo: '', highlights: [] }),
            fields: memberFields,
          },
        ],
      },
    ],
  },
]

/* ---------------- Contact ---------------- */
export const contactSchema: FieldDef[] = [
  {
    type: 'group', name: 'hero', label: 'Hero',
    fields: [
      { type: 'text', name: 'actName', label: 'Act label' },
      { type: 'text', name: 'kicker', label: 'Kicker' },
      titleField(),
      { type: 'textarea', name: 'intro', label: 'Intro' },
    ],
  },
  {
    type: 'section', name: 'details', label: 'Details',
    fields: [
      { type: 'text', name: 'email', label: 'Email' },
      { type: 'stringList', name: 'enquiryTypes', label: 'Enquiry types', hint: 'One per line.' },
      { type: 'text', name: 'presence', label: 'Presence line' },
      { type: 'textarea', name: 'formIntro', label: 'Form intro' },
    ],
  },
  {
    type: 'section', name: 'offices', label: 'Offices',
    fields: [
      {
        type: 'array', name: 'offices', label: 'Offices', itemTitleKey: 'city',
        newItem: () => ({ city: '', region: '', address: '' }),
        fields: [
          { type: 'row', fields: [{ type: 'text', name: 'city', label: 'City' }, { type: 'text', name: 'region', label: 'Region' }] },
          { type: 'textarea', name: 'address', label: 'Address' },
        ],
      },
    ],
  },
]
