'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { AnimatedTitle } from '@/components/AnimatedTitle'
import { Rich } from '@/components/Rich'
import { useSmoothScroll } from '@/components/SmoothScroll'
import { asset, route } from '@/content'
import type { AboutPage, SiteSettings } from '@/content/types'
import { EASE, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'

import styles from './About.module.css'

// Accessible name for a CSS-background image without converting it to <img>.
const imgA11y = (alt?: string) => (alt ? { role: 'img' as const, 'aria-label': alt } : {})

// The four ecosystem nodes sit at the cardinal points around the JV mark
// (top, right, bottom, left), matching the old jv-scene positions.
const ORBIT_POS = [
  { left: '50%', top: '10%' },
  { left: '88%', top: '50%' },
  { left: '50%', top: '88%' },
  { left: '12%', top: '50%' },
] as const
// Gradient dots sit on each spoke between the centre and its node.
const ORBIT_DOTS = [
  { left: '50%', top: '16.67%' },
  { left: '83.33%', top: '50%' },
  { left: '50%', top: '83.33%' },
  { left: '16.67%', top: '50%' },
] as const

// Decorative stat-card badges (old design). Keyed by stat index — purely
// presentational, so they live here rather than in the CMS ledger items.
const STAT_BADGES = [
  'assets/Group-1244834306.png',
  'assets/Group-1244834307.png',
  'assets/Group-1244834254.png',
  'assets/Group-1244834256.png',
] as const

// Stacked-card positions (front -> back) for the desktop Platforms card stack.
const STACK_POS = [
  { x: 0, y: 0, rotate: 0, scale: 1, zIndex: 40 },
  { x: 22, y: 16, rotate: 5, scale: 0.95, zIndex: 30 },
  { x: 44, y: 32, rotate: 10, scale: 0.9, zIndex: 20 },
  { x: 66, y: 48, rotate: 15, scale: 0.85, zIndex: 10 },
] as const

export function About({ about }: { about: AboutPage; settings: SiteSettings }) {
  const scope = useRef<HTMLDivElement>(null)
  const { reduced } = useSmoothScroll()
  const { hero, platformsSection, belief, method, models, grids } = about ?? ({} as AboutPage)

  // Pioneering-models accordion: one open at a time, first open by default.
  const [openModel, setOpenModel] = useState(0)

  // Mobile carousels (Approach + Platforms) — active-dot indices.
  const approachTrackRef = useRef<HTMLDivElement>(null)
  const platformsTrackRef = useRef<HTMLDivElement>(null)
  const [approachIdx, setApproachIdx] = useState(0)
  const [platformsIdx, setPlatformsIdx] = useState(0)

  const approachCount = (method?.cards ?? []).length
  const platformsCount = (platformsSection?.cards ?? []).length

  // Scroll a carousel track to a given slide (used by the dot indicators).
  const scrollToSlide = (track: HTMLElement | null, i: number) => {
    const slide = track?.children?.[i] as HTMLElement | undefined
    track?.scrollTo({ left: slide?.offsetLeft ?? 0, behavior: 'smooth' })
  }

  /* Bespoke interactions, all with full cleanup:
     - mobile (<768px): auto-advancing scroll-snap carousels (Approach 2500ms,
       Platforms 3000ms) + dot tracking.
     - desktop (>=768px, not reduced-motion): the Platforms cards start as an
       auto-cycling stack, then morph (manual FLIP) into the responsive grid
       when scrolled into view. The grid is the guaranteed fallback. */
  useEffect(() => {
    const cleanups: Array<() => void> = []
    const mqDesktop = window.matchMedia('(min-width: 768px)')

    // ---- Mobile auto-scroll carousels ----------------------------------
    const setupCarousel = (
      track: HTMLElement | null,
      setIdx: (n: number) => void,
      intervalMs: number,
    ) => {
      if (!track) return
      const slides = () => Array.from(track.children) as HTMLElement[]
      const count = slides().length
      if (count === 0) return
      const pitch = () => {
        const s = slides()
        return s.length > 1 ? s[1].offsetLeft - s[0].offsetLeft || track.clientWidth : track.clientWidth
      }
      let idx = 0
      const onScroll = () => {
        const p = pitch() || 1
        idx = Math.max(0, Math.min(count - 1, Math.round(track.scrollLeft / p)))
        setIdx(idx)
      }
      track.addEventListener('scroll', onScroll, { passive: true })
      cleanups.push(() => track.removeEventListener('scroll', onScroll))

      if (!reduced) {
        const id = window.setInterval(() => {
          if (mqDesktop.matches) return // mobile-only
          const next = (idx + 1) % count
          scrollToSlide(track, next)
        }, intervalMs)
        cleanups.push(() => window.clearInterval(id))
      }
    }
    setupCarousel(approachTrackRef.current, setApproachIdx, 2500)
    setupCarousel(platformsTrackRef.current, setPlatformsIdx, 3000)

    // ---- Desktop card-stack -> grid morph ------------------------------
    const container = platformsTrackRef.current
    if (container && !reduced && mqDesktop.matches) {
      const cards = Array.from(container.children) as HTMLElement[]
      if (cards.length > 0) {
        const order = cards.map((_, i) => i) // order[i] = stack position of card i
        let morphed = false

        // Enter stack mode: absolutely overlap the cards and size the wrapper.
        container.classList.add(styles.stackActive)
        gsap.set(cards, { clearProps: 'all' })
        const wrapHeight = Math.max(...cards.map((c) => c.offsetHeight))
        container.style.height = `${wrapHeight + 56}px`
        cards.forEach((c) => {
          c.style.boxShadow = '0 24px 50px rgba(0, 0, 0, 0.4)'
        })
        cards.forEach((c, i) => {
          const p = STACK_POS[Math.min(order[i], STACK_POS.length - 1)]
          gsap.set(c, { x: p.x, y: p.y, rotate: p.rotate, scale: p.scale, zIndex: p.zIndex, opacity: 1 })
        })

        const cycle = () => {
          if (morphed) return
          const frontIdx = order.indexOf(0)
          const card = cards[frontIdx]
          gsap.to(card, {
            x: -360,
            rotate: -22,
            opacity: 0,
            duration: 0.7,
            ease: 'power2.in',
            onComplete: () => {
              if (morphed) return
              for (let i = 0; i < order.length; i++) {
                order[i] = order[i] === 0 ? STACK_POS.length - 1 : order[i] - 1
              }
              const back = STACK_POS[STACK_POS.length - 1]
              gsap.set(card, {
                x: back.x,
                y: back.y,
                rotate: back.rotate,
                scale: back.scale,
                zIndex: back.zIndex,
                opacity: 0,
              })
              gsap.to(card, { opacity: 1, duration: 0.6, ease: EASE })
              cards.forEach((c, i) => {
                if (c === card) return
                const p = STACK_POS[Math.min(order[i], STACK_POS.length - 1)]
                gsap.to(c, { x: p.x, y: p.y, rotate: p.rotate, scale: p.scale, zIndex: p.zIndex, duration: 0.6, ease: EASE })
              })
            },
          })
        }
        const intervalId = window.setInterval(cycle, 6500)
        cleanups.push(() => window.clearInterval(intervalId))

        const morphToGrid = () => {
          if (morphed) return
          morphed = true
          window.clearInterval(intervalId)
          gsap.killTweensOf(cards)
          const first = cards.map((c) => c.getBoundingClientRect())
          container.classList.remove(styles.stackActive)
          container.style.height = ''
          cards.forEach((c) => {
            gsap.set(c, { clearProps: 'all' })
            c.style.boxShadow = ''
          })
          const last = cards.map((c) => c.getBoundingClientRect())
          cards.forEach((c, i) => {
            const dx = first[i].left - last[i].left
            const dy = first[i].top - last[i].top
            const sx = last[i].width ? first[i].width / last[i].width : 1
            gsap.fromTo(
              c,
              { x: dx, y: dy, scale: sx, opacity: 0.4, transformOrigin: 'top left' },
              {
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
                duration: 0.8,
                ease: EASE,
                delay: i * 0.08,
                clearProps: 'transform,opacity',
              },
            )
          })
        }
        const st = ScrollTrigger.create({ trigger: container, start: 'top 70%', once: true, onEnter: morphToGrid })
        cleanups.push(() => st.kill())

        // Reset any inline state if the effect tears down (e.g. reduced toggles).
        cleanups.push(() => {
          container.classList.remove(styles.stackActive)
          container.style.height = ''
          gsap.killTweensOf(cards)
          gsap.set(cards, { clearProps: 'all' })
          cards.forEach((c) => {
            c.style.boxShadow = ''
          })
        })
      }
    }

    return () => cleanups.forEach((fn) => fn())
  }, [reduced, approachCount, platformsCount])

  useGSAP(
    () => {
      const root = scope.current
      if (!root) return

      if (!reduced) {
        /* masked line reveals — hero plays on load with a stagger, rest on scroll */
        gsap.utils.toArray<HTMLElement>('.line-inner').forEach((el, i) => {
          const inHero = !!el.closest('[data-hero]')
          gsap.to(el, {
            y: 0,
            duration: 1.2,
            ease: EASE,
            delay: inHero ? 0.15 + (i % 6) * 0.12 : 0,
            scrollTrigger: inHero
              ? undefined
              : { trigger: el.closest('.line'), start: 'top 88%', once: true },
          })
        })

        /* generic fadeInUp entrance */
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: EASE,
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          })
        })

        /* The orbital diagram (rings, spokes, dots, node entrance) is driven by
           pure CSS animations in the module — no GSAP needed here. */
      }

      /* stat counters */
      root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count || 0)
        const prefix = el.dataset.prefix || ''
        const suffix = el.dataset.suffix || ''
        const plain = el.hasAttribute('data-plain')
        const fmt = (v: number) =>
          prefix + (plain ? String(Math.round(v)) : Math.round(v).toLocaleString('en-IN')) + suffix
        if (reduced) {
          el.textContent = fmt(target)
          return
        }
        const obj = { v: 0 }
        ScrollTrigger.create({
          trigger: el,
          start: 'top 90%',
          once: true,
          onEnter: () =>
            gsap.to(obj, {
              v: target,
              duration: 1.4,
              ease: 'power2.out',
              onUpdate: () => (el.textContent = fmt(obj.v)),
            }),
        })
      })
    },
    { scope, dependencies: [reduced] },
  )

  return (
    <div ref={scope} className={styles.about}>
      <main id="top">
        {/* 1 · HERO ----------------------------------------------------------- */}
        <section className={styles.hero} data-cms-section="hero" data-hero>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <AnimatedTitle as="h1" className={styles.heroTitle} title={hero?.title} />
              <Rich as="p" className={styles.heroSub} html={hero?.subtitle ?? ''} />
              <p className={`${styles.heroIntro} reveal`}>{hero?.intro}</p>
              {hero?.intro2 ? <p className={`${styles.heroIntro} reveal`}>{hero.intro2}</p> : null}
            </div>

            <div className={`${styles.scene} reveal`} aria-hidden={(hero?.orbit ?? []).length === 0}>
              {/* static dashed rings */}
              <div className={styles.dottedRing} />
              <div className={styles.outerRing} />
              {/* rotating glow line that sweeps around through all four nodes */}
              <div className={styles.diag} />
              {/* spinning bright arcs */}
              <div className={styles.ringArc} />
              <div className={styles.ringArc2} />
              {/* spokes from centre to each node */}
              <svg className={styles.spokesSvg} viewBox="0 0 480 480" aria-hidden="true">
                <line x1="240" y1="240" x2="240" y2="80" stroke="rgba(95,168,255,0.6)" strokeWidth="1" />
                <line x1="240" y1="240" x2="400" y2="240" stroke="rgba(95,168,255,0.6)" strokeWidth="1" />
                <line x1="240" y1="240" x2="240" y2="400" stroke="rgba(95,168,255,0.6)" strokeWidth="1" />
                <line x1="240" y1="240" x2="80" y2="240" stroke="rgba(95,168,255,0.6)" strokeWidth="1" />
              </svg>
              {/* gradient dots on the spokes */}
              {ORBIT_DOTS.map((d) => (
                <span className={styles.dot} style={{ left: d.left, top: d.top }} key={`${d.left}-${d.top}`} />
              ))}
              {/* centre logo ring */}
              <div className={styles.core}>
                {hero?.heroImage ? (
                  <img src={asset(hero.heroImage)} alt={hero.heroImageAlt || ''} loading="lazy" decoding="async" />
                ) : null}
              </div>
              {/* the four ecosystem nodes (label above for the top one, below for the rest) */}
              {(hero?.orbit ?? []).slice(0, 4).map((node, i) => {
                const pos = ORBIT_POS[i] ?? ORBIT_POS[0]
                const labelAbove = i === 0
                const label = <span className={styles.nodeLabel}>{node.label}</span>
                return (
                  <div
                    className={styles.node}
                    style={{ left: pos.left, top: pos.top, animationDelay: `${1.5 + i * 0.15}s` }}
                    key={node.label}
                  >
                    {labelAbove ? label : null}
                    <span className={styles.nodeIcon}>
                      <img src={asset(node.image)} alt="" loading="lazy" decoding="async" />
                    </span>
                    {labelAbove ? null : label}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 2 · STATS BAND ----------------------------------------------------- */}
        <section className={styles.stats} data-cms-section="stats">
          <div className={styles.statsGrid}>
            {(hero?.ledger ?? []).map((item, i) => (
              <div className={`${styles.statCard} reveal`} key={i}>
                {STAT_BADGES[i] ? (
                  <img
                    className={styles.statBadge}
                    src={asset(STAT_BADGES[i])}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
                <span
                  className={styles.statNum}
                  data-count={item.value}
                  {...(item.prefix ? { 'data-prefix': item.prefix } : {})}
                  {...(item.suffix ? { 'data-suffix': item.suffix } : {})}
                  {...(item.plain ? { 'data-plain': '' } : {})}
                >
                  {item.prefix || ''}
                  {item.value}
                  {item.suffix || ''}
                </span>
                <span className={styles.statLabel}>{item.label}</span>
                <span className={styles.statRule} aria-hidden="true" />
              </div>
            ))}
          </div>
          {hero?.ledgerCaption ? (
            <p className={`${styles.framedCaption} reveal`}>{hero.ledgerCaption}</p>
          ) : null}
        </section>

        {/* 3 · BELIEF TRIAD --------------------------------------------------- */}
        <section className={styles.belief} data-cms-section="belief">
          <div className={styles.beliefRow}>
            {(belief?.rows ?? []).map((r) => {
              // Old design: "in INTENT" — the qualifier keyword is uppercase + italic.
              const parts = (r.note ?? '').trim().split(' ')
              const lead = parts[0] ?? ''
              const keyword = parts.slice(1).join(' ')
              return (
                <div className={`${styles.beliefItem} reveal`} key={r.num}>
                  <Rich as="h2" className={styles.beliefWord} html={r.line} />
                  <p className={styles.beliefNote}>
                    {lead}{keyword ? <em>{' '}{keyword.toUpperCase()}</em> : null}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* 4 · OUR APPROACH --------------------------------------------------- */}
        <section className={styles.approach} id="approach" data-cms-section="method">
          <div className={`${styles.sectionHead} ${styles.sectionHeadCenter}`}>
            {method?.copy ? (
              <p className={`${styles.sectionLead} reveal`}>{method.copy}</p>
            ) : null}
          </div>
          <div className={styles.approachGrid} ref={approachTrackRef}>
            {(method?.cards ?? []).map((c, i) => (
              <article className={`${styles.approachCard} reveal`} key={i}>
                {c.icon ? (
                  <img
                    className={styles.approachIcon}
                    src={asset(c.icon)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
                <h4
                  className={styles.approachTitle}
                  dangerouslySetInnerHTML={{ __html: c.title }}
                />
                <p className={styles.approachDesc}>{c.desc}</p>
              </article>
            ))}
          </div>
          {approachCount > 1 ? (
            <div className={styles.dots} role="tablist" aria-label="Approach slides">
              {(method?.cards ?? []).map((_, i) => (
                <button
                  type="button"
                  role="tab"
                  key={i}
                  className={`${styles.dot}${i === approachIdx ? ' ' + styles.dotOn : ''}`}
                  aria-label={`Go to approach ${i + 1}`}
                  aria-selected={i === approachIdx}
                  onClick={() => scrollToSlide(approachTrackRef.current, i)}
                />
              ))}
            </div>
          ) : null}
        </section>

        {/* 5 · FOUR PLATFORMS ------------------------------------------------- */}
        {platformsSection ? (
          <section className={styles.platforms} id="platforms" data-cms-section="platformsSection">
            <div className={styles.platformsRow}>
              <div className={styles.platformsText}>
                <AnimatedTitle
                  as="h2"
                  className={`${styles.sectionTitle} ${styles.platformsTitle}`}
                  title={platformsSection.title}
                />
                {platformsSection.copy ? (
                  <p className={`${styles.sectionCopy} reveal`}>{platformsSection.copy}</p>
                ) : null}
              </div>
              <div className={styles.platformsCards} ref={platformsTrackRef}>
                {(platformsSection.cards ?? []).map((card, i) => (
                  <article className={styles.platformCard} key={i}>
                    <div
                      className={styles.platformImg}
                      {...imgA11y(card.imageAlt)}
                      style={{ backgroundImage: `url(${asset(card.image)})` }}
                    >
                      {card.logo ? (
                        <img
                          className={styles.platformLogo}
                          src={asset(card.logo)}
                          alt={card.logoAlt || ''}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                    </div>
                    <div className={styles.platformBody}>
                      <p className={styles.platformDesc}>{card.desc}</p>
                      <Link className={styles.platformCta} href={route(card.href)}>
                        {card.ctaLabel || 'LEARN MORE'}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            {platformsCount > 1 ? (
              <div className={styles.dots} role="tablist" aria-label="Platform slides">
                {(platformsSection.cards ?? []).map((_, i) => (
                  <button
                    type="button"
                    role="tab"
                    key={i}
                    className={`${styles.dot}${i === platformsIdx ? ' ' + styles.dotOn : ''}`}
                    aria-label={`Go to platform ${i + 1}`}
                    aria-selected={i === platformsIdx}
                    onClick={() => scrollToSlide(platformsTrackRef.current, i)}
                  />
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* 6 · PIONEERING MODELS --------------------------------------------- */}
        <section className={styles.models} id="models" data-cms-section="models">
          <div className={`${styles.sectionHead} ${styles.sectionHeadCenter}`}>
            {models?.copy ? <p className={`${styles.sectionLead} reveal`}>{models.copy}</p> : null}
          </div>
          <div className={`${styles.modelsSplit} reveal`}>
            <div className={styles.modelsStage} aria-hidden="true">
              {(models?.rows ?? []).map((r, i) => (
                <div
                  className={`${styles.stageImg}${i === openModel ? ' ' + styles.stageActive : ''}`}
                  key={i}
                  style={{ backgroundImage: `url(${asset(r.image)})` }}
                />
              ))}
            </div>
            <div className={styles.accordion}>
              {(models?.rows ?? []).map((r, i) => {
                const open = i === openModel
                return (
                  <div
                    className={`${styles.accItem}${open ? ' ' + styles.accOpen : ''}`}
                    key={r.num}
                  >
                    <button
                      type="button"
                      className={styles.accHead}
                      aria-expanded={open}
                      onClick={() => setOpenModel(i)}
                    >
                      <span className={styles.accNum}>{r.num}</span>
                      {r.icon ? (
                        <img
                          className={styles.accIcon}
                          src={asset(r.icon)}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                      <span className={styles.accTitle}>{r.title}</span>
                    </button>
                    <div className={styles.accPanel}>
                      <p>{r.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 7 · GRIDS ---------------------------------------------------------- */}
        <section className={styles.grids} id="grids" data-cms-section="grids">
          <div className={`${styles.sectionHead} ${styles.sectionHeadCenter}`}>
            {grids?.actName ? <h2 className={styles.gridsEyebrow}>{grids.actName}</h2> : null}
            <AnimatedTitle as="h2" className={`${styles.sectionTitle} ${styles.gridsTitle}`} title={grids?.title} />
            {grids?.copy ? <p className={`${styles.sectionLead} reveal`}>{grids.copy}</p> : null}
          </div>

          <div className={`${styles.gridsStage} reveal`}>
            {grids?.morphImage ? (
              <img
                className={styles.gridsImg}
                src={asset(grids.morphImage)}
                alt={grids.morphAlt || ''}
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <div className={styles.gridsCompare}>
              <div className={`${styles.compareCol} ${styles.compareA}`}>
                <h4>{grids?.labelA?.title}</h4>
                <p>{grids?.labelA?.text}</p>
              </div>
              <div className={`${styles.compareCol} ${styles.compareB}`}>
                <h4>{grids?.labelB?.title}</h4>
                <p>{grids?.labelB?.text}</p>
              </div>
            </div>
          </div>

          <div className={`${styles.layersBlock} reveal`}>
            <h4 className={styles.layersHeading}>Built on Integrated Layers</h4>
            <ul className={styles.layersGrid}>
              {(grids?.layers ?? []).map((l) => (
                <li className={`${styles.layer} reveal`} key={l.num}>
                  {l.icon ? (
                    <img
                      className={styles.layerIcon}
                      src={asset(l.icon)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  <strong className={styles.layerTitle}>{l.title}</strong>
                  <span className={styles.layerSub}>{l.subtitle}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}
