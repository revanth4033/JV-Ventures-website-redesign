export type FieldDef =
  | { type: 'text' | 'textarea' | 'number' | 'checkbox' | 'image'; name: string; label: string; hint?: string }
  | { type: 'rich'; name: string; label: string; hint?: string; multiline?: boolean } // WYSIWYG bold/italic — stores inline HTML
  | { type: 'richList'; name: string; label: string; hint?: string } // list of WYSIWYG lines
  | { type: 'lines'; name: string; label: string; hint?: string }
  | { type: 'stringList'; name: string; label: string; hint?: string }
  | { type: 'group'; name: string; label?: string; fields: FieldDef[] }
  | { type: 'section'; name: string; label: string; fields: FieldDef[] } // collapsible panel; children stay at same data path
  | { type: 'row'; fields: FieldDef[] } // layout-only: lay children side by side
  | {
      type: 'array'
      name: string
      label: string
      itemTitleKey?: string // which child field to show in the item header
      flat?: boolean // true = items always expanded (short rows); default = collapsible
      fields: FieldDef[]
      newItem?: () => Record<string, unknown>
    }

export const join = (prefix: string, name: string) => (prefix ? `${prefix}.${name}` : name)
