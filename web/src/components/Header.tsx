'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { asset, route } from '@/content'
import type { SiteSettings } from '@/content/types'
import { useSmoothScroll } from './SmoothScroll'

export function Header({ settings }: { settings: SiteSettings }) {
  const { logo, nav } = settings
  const headerRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { lenis } = useSmoothScroll()

  // smart header: backdrop after 40px (Lenis scroll if present, else native)
  useEffect(() => {
    const onScroll = (y: number) => setScrolled(y > 40)
    if (lenis) {
      const handler = (e: { scroll: number }) => onScroll(e.scroll)
      lenis.on('scroll', handler)
      return () => lenis.off('scroll', handler)
    }
    const native = () => onScroll(window.scrollY)
    window.addEventListener('scroll', native, { passive: true })
    return () => window.removeEventListener('scroll', native)
  }, [lenis])

  // mobile menu controls Lenis + closes on Escape
  useEffect(() => {
    if (lenis) (open ? lenis.stop() : lenis.start())
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, lenis])

  return (
    <header ref={headerRef} className={`site-header${scrolled ? ' scrolled' : ''}${open ? ' nav-open' : ''}`}>
      <Link className="logo" href="/" onClick={() => setOpen(false)}>
        <Image src={asset(logo.src)} alt={logo.alt} width={240} height={30} priority unoptimized />
      </Link>
      <nav className="site-nav">
        {nav
          // hide dead placeholder links until a real URL is set in the CMS
          .filter((item) => item.dropdown?.length || (item.href && item.href !== '#'))
          .map((item) => {
          if (item.dropdown) {
            return (
              <div className="nav-has-drop" key={item.label}>
                <Link
                  href={route(item.href)}
                  className="nav-drop-trigger"
                  aria-haspopup="true"
                  aria-expanded="false"
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
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>
    </header>
  )
}
