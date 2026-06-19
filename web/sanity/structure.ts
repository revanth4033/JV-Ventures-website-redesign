import type {StructureResolver} from 'sanity/structure'

/** Document type names that are singletons (one editable document, fixed _id). */
const SINGLETONS = [
  {id: 'siteSettings', title: 'Site Settings'},
  {id: 'homePage', title: 'Home Page'},
  {id: 'aboutPage', title: 'About Page'},
  {id: 'teamPage', title: 'Team Page'},
  {id: 'contactPage', title: 'Contact Page'},
] as const

/** Document types that must not appear as generic lists (the singletons above). */
const SINGLETON_IDS = SINGLETONS.map((s) => s.id)

/**
 * Desk structure: the five singletons as single editable documents (their
 * document type name === fixed _id), then platforms as an ordered list.
 */
const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      ...SINGLETONS.map(({id, title}) =>
        S.listItem()
          .title(title)
          .id(id)
          .child(S.document().schemaType(id).documentId(id)),
      ),
      S.divider(),
      S.listItem()
        .title('Platforms')
        .schemaType('platform')
        .child(
          S.documentTypeList('platform')
            .title('Platforms')
            .defaultOrdering([{field: 'order', direction: 'asc'}]),
        ),
      S.divider(),
      // Any remaining document types (none today) fall through here.
      ...S.documentTypeListItems().filter((item) => {
        const id = item.getId()
        return id !== 'platform' && !SINGLETON_IDS.includes(id as (typeof SINGLETON_IDS)[number])
      }),
    ])

export default structure
