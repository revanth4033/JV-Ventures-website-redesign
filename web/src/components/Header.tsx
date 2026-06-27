'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { asset, route } from '@/content'
import type { SiteSettings } from '@/content/types'
import { useSmoothScroll } from './SmoothScroll'

export function Header({ settings }: { settings: SiteSettings }) {
  const { logo, nav, ui } = settings
  const headerRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  // which nav dropdown is currently revealed (hover or keyboard focus), so
  // aria-expanded reflects reality instead of being hardcoded false.
  const [openDrop, setOpenDrop] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [atTopEdge, setAtTopEdge] = useState(false)
  // auto-hide only where there's a real pointer to reveal it again; touch
  // devices keep the bar pinned so the menu button is always reachable.
  const [autoHide, setAutoHide] = useState(false)
  const { lenis } = useSmoothScroll()

  // auto-hide header: track scroll position (Lenis if present, else native) and
  // whether the pointer is hovering the top edge so the bar can pull back down.
  useEffect(() => {
    // Client-only capability read (no SSR equivalent); intentional one-time set.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutoHide(window.matchMedia('(pointer: fine)').matches)

    const onScroll = (y: number) => setScrolled(y > 40)
    let cleanupScroll: () => void
    if (lenis) {
      const handler = (e: { scroll: number }) => onScroll(e.scroll)
      lenis.on('scroll', handler)
      cleanupScroll = () => lenis.off('scroll', handler)
    } else {
      const native = () => onScroll(window.scrollY)
      window.addEventListener('scroll', native, { passive: true })
      cleanupScroll = () => window.removeEventListener('scroll', native)
    }

    const onMove = (e: MouseEvent) => setAtTopEdge(e.clientY <= 70)
    window.addEventListener('mousemove', onMove, { passive: true })

    return () => {
      cleanupScroll()
      window.removeEventListener('mousemove', onMove)
    }
  }, [lenis])

  // hidden once scrolled past the top, unless the pointer is at the top edge or
  // the mobile menu is open. Disabled on touch (autoHide=false → never hidden).
  const hidden = autoHide && scrolled && !atTopEdge && !open

  // mobile menu controls Lenis + closes on Escape
  useEffect(() => {
    if (lenis) (open ? lenis.stop() : lenis.start())
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, lenis])

  return (
    <header ref={headerRef} className={`site-header${scrolled && !open ? ' scrolled' : ''}${hidden ? ' is-hidden' : ''}${open ? ' nav-open' : ''}`}>
      <Link className="logo" href={ui?.logoHref || '/'} onClick={() => setOpen(false)} data-cms-section="logo">
        <Image src={asset(logo.src)} alt={logo.alt} width={240} height={30} priority unoptimized />
      </Link>
      <nav className="site-nav" data-cms-section="navigation">
        {nav
          // hide dead placeholder links until a real URL is set in the CMS
          .filter((item) => item.dropdown?.length || (item.href && item.href !== '#'))
          .map((item) => {
          if (item.dropdown) {
            return (
              <div
                className="nav-has-drop"
                key={item.label}
                onMouseEnter={() => setOpenDrop(item.label)}
                onMouseLeave={() => setOpenDrop((cur) => (cur === item.label ? null : cur))}
                onFocus={() => setOpenDrop(item.label)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setOpenDrop((cur) => (cur === item.label ? null : cur))
                  }
                }}
              >
                <Link
                  href={route(item.href)}
                  className="nav-drop-trigger"
                  aria-haspopup="true"
                  aria-expanded={openDrop === item.label}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                  <span className="nav-caret" aria-hidden="true" />
                </Link>
                <div className="nav-drop">
                  {item.dropdown.map((d) => (
                    <Link href={route(d.href)} key={d.name} onClick={() => setOpen(false)}>
                      <span className="nd-name">{d.name}</span>
                      <span className="nd-sector">{d.sector}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          }
          return (
            <Link
              key={item.label}
              href={route(item.href)}
              className={item.cta ? 'nav-cta' : undefined}
              onClick={() => setOpen(false)}
              {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <button
        className="nav-toggle"
        aria-label={ui?.menuLabel || 'Menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>
    </header>
  )
}
