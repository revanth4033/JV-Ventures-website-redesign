'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { ClosingBridge } from '@/components/ClosingBridge'
import { useSmoothScroll } from '@/components/SmoothScroll'
import { asset } from '@/content'
import type { Platform as PlatformT, SiteSettings, Venture } from '@/content/types'
import { EASE, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'

const pad = (n: number) => String(n).padStart(2, '0')
// Accessible name for a CSS-background image without converting it to <img>.
const imgA11y = (alt?: string) => (alt ? { role: 'img' as const, 'aria-label': alt } : {})

type FlatVenture = Venture & { category: string }

const flatten = (p: PlatformT): FlatVenture[] =>
  p.categories.flatMap((cat) => cat.ventures.map((v) => ({ ...v, category: cat.label })))

/* count-up that preserves the surrounding text of a metric/total string.
   The true value is cached on the element so a re-run (e.g. React Strict-Mode
   double-invoke, which can leave a half-animated "0" behind) always animates
   toward the real number instead of reading the stale "0" and bailing out. */
function animateNumber(el: HTMLElement, duration = 1.3) {
  const raw = el.dataset.full ?? el.textContent ?? ''
  el.dataset.full = raw
  const m = raw.match(/([\d,.]+)/)
  if (!m) return
  const numStr = m[1]
  const target = parseFloat(numStr.replace(/,/g, ''))
  if (!isFinite(target) || target === 0) {
    el.textContent = raw
    return
  }
  const decimals = (numStr.split('.')[1] || '').length
  const obj = { v: 0 }
  gsap.to(obj, {
    v: target,
    duration,
    ease: 'power2.out',
    overwrite: true,
    onUpdate: () => {
      const val = decimals ? obj.v.toFixed(decimals) : Math.round(obj.v).toLocaleString('en-IN')
      el.textContent = raw.replace(numStr, val)
    },
    onComplete: () => {
      el.textContent = raw
    },
  })
}

/* ---------- THEATER: cinematic pinned beats ---------- */
type PlatformLabels = SiteSettings['platformLabels']

function VentureTheater({ platform, ventures, labels }: { platform: PlatformT; ventures: FlatVenture[]; labels?: PlatformLabels }) {
  const ref = useRef<HTMLElement>(null)
  const { lenis } = useSmoothScroll()
  // one beat per category; a category may hold several ventures (e.g. Services
  // = Inventre + Abeona) shown as chips you switch between within that beat
  const cats: { label: string; idxs: number[] }[] = []
  ventures.forEach((v, i) => {
    const c = cats.find((x) => x.label === v.category)
    if (c) c.idxs.push(i)
    else cats.push({ label: v.category, idxs: [i] })
  })
  const C = cats.length
  const catOf = (i: number) => cats.findIndex((c) => c.idxs.includes(i))

  useGSAP(
    () => {
      const sec = ref.current!
      const photos = gsap.utils.toArray<HTMLElement>('.th-photo')
      const pages = gsap.utils.toArray<HTMLElement>('.thx-page')
      const items = gsap.utils.toArray<HTMLElement>('.ven-rail-item')
      const ghost = sec.querySelector<HTMLElement>('.thx-ghost')
      const counted = new Set<Element>()
      const selected = cats.map((c) => c.idxs[0]) // remembered venture per category
      let curCat = -1
      let curVen = -1

      const countMetrics = (panel: HTMLElement) => {
        if (counted.has(panel)) return
        counted.add(panel)
        panel.querySelectorAll<HTMLElement>('.ven-metric-num').forEach((el) => animateNumber(el, 1))
      }

      // activate a specific venture (used by both scroll + chip clicks)
      const showVenture = (gi: number) => {
        if (gi === curVen) return
        curVen = gi
        const catIdx = catOf(gi)
        photos.forEach((p, j) => p.classList.toggle('active', j === gi))
        pages.forEach((p, j) => p.classList.toggle('active', j === gi))
        items.forEach((it, j) => it.classList.toggle('active', j === catIdx))
        if (ghost) {
          ghost.textContent = pad(catIdx + 1)
          gsap.fromTo(ghost, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
        }
        countMetrics(pages[gi])
      }

      // scroll lands on a category; show its remembered (default first) venture
      const setBeat = (catIdx: number) => {
        if (catIdx === curCat) return
        curCat = catIdx
        showVenture(selected[catIdx])
      }

      const st = ScrollTrigger.create({
        trigger: sec,
        start: 'top top',
        end: '+=' + C * 110 + '%',
        pin: true,
        onUpdate: (self) => {
          setBeat(Math.min(C - 1, Math.floor(self.progress * C)))
          gsap.set('.thx-fill', { scaleX: self.progress })
        },
      })
      setBeat(0)

      // rail click -> jump to that category's beat
      const onRail = (e: Event) => {
        const j = +(e.currentTarget as HTMLElement).dataset.cat!
        const y = st.start + ((st.end - st.start) * (j + 0.5)) / C
        lenis ? lenis.scrollTo(y, { duration: 0.9 }) : window.scrollTo({ top: y, behavior: 'smooth' })
      }
      // keyboard equivalent (the rail items are role="button" tabbable)
      const onRailKey = (e: Event) => {
        const k = (e as KeyboardEvent).key
        if (k === 'Enter' || k === ' ') {
          e.preventDefault()
          onRail(e)
        }
      }
      items.forEach((it) => {
        it.addEventListener('click', onRail)
        it.addEventListener('keydown', onRailKey)
      })

      // prev/next arrows -> cycle ventures within the current category (no scroll)
      const step = (dir: number) => {
        if (curCat < 0) return
        const idxs = cats[curCat].idxs
        if (idxs.length < 2) return
        const pos = idxs.indexOf(curVen)
        const gi = idxs[(pos + dir + idxs.length) % idxs.length]
        selected[curCat] = gi
        showVenture(gi)
      }
      const prevBtns = gsap.utils.toArray<HTMLElement>('.thx-nav--prev')
      const nextBtns = gsap.utils.toArray<HTMLElement>('.thx-nav--next')
      const onPrev = () => step(-1)
      const onNext = () => step(1)
      prevBtns.forEach((btn) => btn.addEventListener('click', onPrev))
      nextBtns.forEach((btn) => btn.addEventListener('click', onNext))

      return () => {
        items.forEach((it) => {
          it.removeEventListener('click', onRail)
          it.removeEventListener('keydown', onRailKey)
        })
        prevBtns.forEach((btn) => btn.removeEventListener('click', onPrev))
        nextBtns.forEach((btn) => btn.removeEventListener('click', onNext))
      }
    },
    { scope: ref, dependencies: [C] },
  )

  return (
    <section className="act plat-ventures theater-mode" id="ventures" ref={ref} data-cms-section="ventures">
      <div className="theater theater--index">
        <header className="thx-top">
          <div className="thx-top-left">
            <span className="ven-rail-kicker">{labels?.insideKicker || 'Inside the platform'}</span>
            <img className="thx-wordmark" src={asset(platform.wordmark)} alt={platform.name} loading="lazy" decoding="async" />
          </div>
        </header>
        <span className="thx-ghost" aria-hidden="true">
          01
        </span>
        <div className="thx-frame">
          {ventures.map((v, i) => (
            <div
              className={`th-photo${i === 0 ? ' active' : ''}`}
              key={i}
              {...imgA11y(v.photoAlt)}
              style={{ backgroundImage: `url(${asset(v.photo)})` }}
            />
          ))}
        </div>
        <div className="thx-stack">
          {ventures.map((v, i) => (
            <article className={`thx-page${i === 0 ? ' active' : ''}`} data-i={i} key={i}>
              <h3 className="sr-only">{v.name}</h3>
              <div className="thx-brand">
                {v.logo ? <img className="ven-logo" src={asset(v.logo)} alt={v.name} loading="lazy" decoding="async" /> : null}
                {cats[catOf(i)].idxs.length > 1 ? (
                  <div className="thx-nav-pair">
                    <button type="button" className="thx-nav thx-nav--prev" aria-label={labels?.prevVenture || 'Previous venture'}>‹</button>
                    <button type="button" className="thx-nav thx-nav--next" aria-label={labels?.nextVenture || 'Next venture'}>›</button>
                  </div>
                ) : null}
              </div>
              <p className="ven-desc">{v.desc}</p>
              {v.metrics.length > 0 ? (
                <div className="ven-metrics">
                  {v.metrics.map((m, k) => (
                    <div className="ven-metric" key={k}>
                      <span className="ven-metric-num">{m.value}</span>
                      <span className="ven-metric-label">{m.label}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
        <nav className="thx-tabs">
          <ul className="ven-rail-list">
            {cats.map((c, j) => (
              <li
                className={`ven-rail-item${j === 0 ? ' active' : ''}`}
                data-cat={j}
                key={c.label}
                role="button"
                tabIndex={0}
                aria-label={`Jump to ${c.label}`}
              >
                <i>{pad(j + 1)}</i>
                <span>{c.label}</span>
              </li>
            ))}
          </ul>
          <div className="thx-track">
            <div className="thx-fill" />
          </div>
        </nav>
      </div>
    </section>
  )
}

/* ---------- STREAM: editorial blocks (mobile / reduced / single venture) ---------- */
function VentureStream({ platform, ventures, labels }: { platform: PlatformT; ventures: FlatVenture[]; labels?: PlatformLabels }) {
  const ref = useRef<HTMLElement>(null)
  const { lenis, reduced } = useSmoothScroll()

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>('.ven-rail-item')
      const blocks = gsap.utils.toArray<HTMLElement>('.ven')
      if (!blocks.length) return
      const setActive = (i: number) => items.forEach((it, j) => it.classList.toggle('active', j === i))
      setActive(0)
      blocks.forEach((b, i) => {
        ScrollTrigger.create({
          trigger: b,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => self.isActive && setActive(i),
        })
        if (!reduced) {
          const img = b.querySelector('.ven-img')
          gsap.fromTo(
            img,
            { scale: 1.08 },
            { scale: 1, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'top 40%', scrub: 0.5 } },
          )
        }
        b.querySelectorAll<HTMLElement>('.ven-metric-num').forEach((el) => {
          if (!reduced) ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => animateNumber(el, 1) })
        })
      })
      const onClick = (e: Event) => {
        const target = blocks[+(e.currentTarget as HTMLElement).dataset.i!]
        lenis ? lenis.scrollTo(target, { offset: -120, duration: 1 }) : target.scrollIntoView({ behavior: 'smooth' })
      }
      const onKey = (e: Event) => {
        const k = (e as KeyboardEvent).key
        if (k === 'Enter' || k === ' ') {
          e.preventDefault()
          onClick(e)
        }
      }
      items.forEach((it) => {
        it.addEventListener('click', onClick)
        it.addEventListener('keydown', onKey)
      })
      return () =>
        items.forEach((it) => {
          it.removeEventListener('click', onClick)
          it.removeEventListener('keydown', onKey)
        })
    },
    { scope: ref, dependencies: [reduced] },
  )

  // mark the first venture of each category (so we can render a category heading)
  const startsCategory = (i: number) => i === 0 || ventures[i].category !== ventures[i - 1].category
  return (
    <section className="act plat-ventures" id="ventures" ref={ref} data-cms-section="ventures">
      <div className="ven-layout">
        <aside className="ven-rail">
          <span className="ven-rail-kicker">{labels?.insideKicker || 'Inside the platform'}</span>
          <div className="ven-rail-name">
            <img src={asset(platform.wordmark)} alt={platform.name} loading="lazy" decoding="async" />
          </div>
          <ul className="ven-rail-list">
            {ventures.map((v, i) => (
              <li
                className={`ven-rail-item${i === 0 ? ' active' : ''}`}
                data-i={i}
                key={i}
                role="button"
                tabIndex={0}
                aria-label={`Jump to ${v.name}`}
              >
                <i>{pad(i + 1)}</i>
                <span>{v.name}</span>
              </li>
            ))}
          </ul>
        </aside>
        <div className="ven-stream">
          {ventures.map((v, i) => {
            return (
              <div key={i}>
                {startsCategory(i) && <div className="ven-cat">{v.category}</div>}
                <article className="ven" id={`ven-${i}`} data-i={i}>
                  <div className="ven-media">
                    <div className="ven-img" {...imgA11y(v.photoAlt)} style={{ backgroundImage: `url(${asset(v.photo)})` }} />
                  </div>
                  <div className="ven-body">
                    <div className="ven-logo-wrap">
                      {v.logo ? (
                        <img className="ven-logo" src={asset(v.logo)} alt={v.name} loading="lazy" decoding="async" />
                      ) : (
                        <h3 className="ven-name-text">{v.name}</h3>
                      )}
                    </div>
                    <p className="ven-desc">{v.desc}</p>
                    {v.metrics.length > 0 ? (
                      <div className="ven-metrics">
                        {v.metrics.map((m, k) => (
                          <div className="ven-metric" key={k}>
                            <span className="ven-metric-num">{m.value}</span>
                            <span className="ven-metric-label">{m.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function Platform({
  platform,
  others,
  settings,
}: {
  platform: PlatformT
  others: PlatformT[]
  settings: SiteSettings
}) {
  const scope = useRef<HTMLDivElement>(null)
  const { reduced } = useSmoothScroll()
  const ventures = flatten(platform)
  const [mode, setMode] = useState<'stream' | 'theater'>('stream')
  const labels = settings.platformLabels
  const arrow = settings.ui?.ctaArrow || '→'

  // Decide theater vs stream on the client and switch reactively on breakpoint /
  // reduced-motion changes. The two are separate components, so changing `mode`
  // remounts the right one and useGSAP tears down the old one's ScrollTriggers —
  // no full page reload (which lost scroll position and re-fetched).
  useEffect(() => {
    const bp = window.matchMedia('(min-width: 1024px)')
    const reducedMM = window.matchMedia('(prefers-reduced-motion: reduce)')
    const decide = () =>
      setMode(ventures.length >= 1 && bp.matches && !reducedMM.matches ? 'theater' : 'stream')
    decide()
    bp.addEventListener('change', decide)
    reducedMM.addEventListener('change', decide)
    return () => {
      bp.removeEventListener('change', decide)
      reducedMM.removeEventListener('change', decide)
    }
  }, [ventures.length])

  // After the layout swaps between theater (pinned) and stream, recompute
  // ScrollTrigger positions so pins/scrubs line up with the new DOM.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [mode])

  // hero + intro + totals + switcher motion (ventures handled by sub-components)
  useGSAP(
    () => {
      const root = scope.current!

      // hero video: play on all viewports (muted + playsInline so it
      // autoplays inline on mobile too); only skipped under reduced-motion
      const vid = root.querySelector<HTMLVideoElement>('.plat-hero-video')
      if (vid && platform.video) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          vid.remove()
        } else {
          vid.poster = asset(platform.hero)
          vid.src = asset(platform.video)
          vid.load()
          vid.addEventListener('canplay', () => vid.classList.add('ready'), { once: true })
          vid.play().catch(() => {})
        }
      }

      // line + reveal primitives
      gsap.utils.toArray<HTMLElement>('.line-inner').forEach((el) => {
        if (reduced) {
          gsap.set(el, { y: 0 })
          return
        }
        gsap.to(el, {
          y: 0,
          duration: 1.2,
          ease: EASE,
          scrollTrigger: el.closest('.plat-hero') ? undefined : { trigger: el.closest('.line'), start: 'top 90%', once: true },
        })
      })
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: reduced ? 0 : 0.7,
          ease: EASE,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        })
      })

      if (!reduced) {
        gsap.fromTo('.plat-wordmark', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: EASE, delay: 0.2 })
        gsap.fromTo('.plat-tagline', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: EASE, delay: 0.5 })
        gsap.to('.plat-hero-media', {
          yPercent: 18,
          ease: 'none',
          scrollTrigger: { trigger: '.plat-hero', start: 'top top', end: 'bottom top', scrub: 0.4 },
        })
      }

      // totals count-up
      root.querySelectorAll<HTMLElement>('.total-num').forEach((el) => {
        if (reduced) return
        ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => animateNumber(el) })
      })
    },
    { scope, dependencies: [reduced, platform.slug, mode] },
  )

  return (
    <div ref={scope}>
      <main id="top">
        {/* HERO */}
        <section className="act plat-hero" id="hero" data-cms-section="hero">
          <div className="plat-hero-media">
            <div className="plat-hero-bg" {...imgA11y(platform.heroAlt)} style={{ backgroundImage: `url(${asset(platform.hero)})` }} />
            {platform.video ? <video className="plat-hero-video" muted loop playsInline preload="none" /> : null}
          </div>
          <div className="plat-hero-veil" />
          <div className="plat-hero-inner">
            <h1 className="sr-only">{platform.name} — {platform.sector} platform</h1>
            <img className="plat-wordmark" src={asset(platform.wordmark)} alt={platform.name} data-cms-section="identity" />
            <p className="plat-tagline">{platform.tagline}</p>
          </div>
          <div className="deck-cue plat-cue" aria-hidden="true">
            <span>{labels?.scrollCue || 'Scroll'}</span>
            <div className="cue-line" />
          </div>
        </section>

        {/* INTRO + TOTALS */}
        <section className="act plat-intro" id="intro">
          <div className="grids-head plat-intro-head">
            <div className="plat-totals reveal" data-cms-section="totals">
              {platform.totals.map((t, i) => (
                <div className="total" key={i}>
                  <span className="total-num">{t.value}</span>
                  <span className="total-label">{t.label}</span>
                </div>
              ))}
            </div>
            <div className="head-right">
              <p className="section-copy reveal plat-intro-copy">{platform.intro}</p>
            </div>
          </div>
        </section>

        {/* VENTURES */}
        {mode === 'theater' ? (
          <VentureTheater platform={platform} ventures={ventures} labels={labels} />
        ) : (
          <VentureStream platform={platform} ventures={ventures} labels={labels} />
        )}

        {/* SWITCHER */}
        <section className="act plat-switch" id="switch">
          <h2 className="section-title">
            <span className="line">
              <span
                className="line-inner"
                dangerouslySetInnerHTML={{ __html: labels?.switcherTitle || 'Explore the <em>other platforms</em>' }}
              />
            </span>
          </h2>
          <div className="switch-grid">
            {others.map((o) => (
              <Link className="switch-tile" href={`/platform/${o.slug}`} key={o.slug}>
                <div className="switch-img" {...imgA11y(o.heroAlt)} style={{ backgroundImage: `url(${asset(o.hero)})` }} />
                <div className="switch-meta">
                  <img src={asset(o.wordmark)} alt={o.name} loading="lazy" decoding="async" />
                  <span>{o.sector}</span>
                </div>
                <span className="switch-go">
                  {labels?.switcherCta || 'Explore'}
                  <span className="arrow">{arrow}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* CLOSE */}
        <ClosingBridge settings={settings} className="plat-close" />
      </main>
    </div>
  )
}
