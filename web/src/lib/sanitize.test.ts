import { describe, expect, it } from 'vitest'

import { sanitizeContent, sanitizeRich } from './sanitize'

describe('sanitizeRich', () => {
  it('strips <script> entirely', () => {
    expect(sanitizeRich('<script>alert(1)</script>hello')).toBe('hello')
  })

  it('strips disallowed event-handler attributes but keeps allowed tags', () => {
    expect(sanitizeRich('<b onclick="evil()">bold</b>')).toBe('<b>bold</b>')
  })

  it('discards <img> (XSS via onerror) but keeps surrounding text', () => {
    expect(sanitizeRich('<img src=x onerror=alert(1)>text')).toBe('text')
  })

  it('drops anchors — no href is allowed through', () => {
    expect(sanitizeRich('<a href="javascript:alert(1)">x</a>')).toBe('x')
  })

  it('preserves the <em class="soi"> brand mark', () => {
    expect(sanitizeRich('<em class="soi">SOI</em>')).toBe('<em class="soi">SOI</em>')
  })

  it('drops disallowed classes on em', () => {
    expect(sanitizeRich('<em class="evil">x</em>')).toBe('<em>x</em>')
  })

  it('leaves plain text (no markup) untouched', () => {
    expect(sanitizeRich('just text — 42% growth')).toBe('just text — 42% growth')
  })

  it('collapses accidental repeated currency symbols', () => {
    expect(sanitizeRich('$$500M')).toBe('$500M')
    expect(sanitizeRich('₹₹₹100')).toBe('₹100')
  })
})

describe('sanitizeContent (deep walk)', () => {
  it('sanitizes strings nested in objects and arrays', () => {
    const dirty = {
      title: '<script>x</script>Clean',
      items: [{ copy: '<img src=x onerror=alert(1)>body' }],
    }
    const clean = sanitizeContent(dirty)
    expect(clean.title).toBe('Clean')
    expect(clean.items[0].copy).toBe('body')
  })

  it('preserves non-string primitives', () => {
    const value = { n: 5, b: true, nil: null, order: 0 }
    expect(sanitizeContent(value)).toEqual(value)
  })
})
