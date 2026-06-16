'use client'

import Link from 'next/link'
import { useRef } from 'react'

import { AnimatedTitle } from '@/components/AnimatedTitle'
import { ClosingBridge } from '@/components/ClosingBridge'
import { Rich } from '@/components/Rich'
import { useSmoothScroll } from '@/components/SmoothScroll'
import { asset, route } from '@/content'
import type { AboutPage, SiteSettings } from '@/content/types'
import { EASE, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'

const pad = (n: number) => String(n).padStart(2, '0')

export function About({ about, settings }: { about: AboutPage; settings: SiteSettings }) {
  const scope = useRef<HTMLDivElement>(null)
  const { reduced } = useSmoothScroll()
  const { hero, belief, method, models, ecosystem, grids } = about

  useGSAP(
    () => {
      const root = scope.current!

      /* act label tracks the section in view */
      const idxEl = root.querySelector<HTMLElement>('#act-index')
      const nameEl = root.querySelector<HTMLElement>('#act-name')
      root.querySelectorAll<HTMLElement>('[data-act]').forEach((sec) => {
        ScrollTrigger.create({
          trigger: sec,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => {
            if (!self.isActive) return
            if (idxEl) idxEl.textContent = sec.dataset.act || ''
            if (nameEl) nameEl.textContent = sec.dataset.actName || ''
          },
        })
      })

      /* masked line reveals (hero plays on load with a stagger; rest on scroll) */
      if (!reduced) {
        gsap.utils.toArray<HTMLElement>('.line-inner').forEach((el, i) => {
          const inHero = !!el.closest('[data-hero]')
          gsap.to(el, {
            y: 0,
            duration: 1.2,
            ease: EASE,
            delay: inHero ? 0.15 + (i % 6) * 0.12 : 0,
            scrollTrigger: inHero ? undefined : { trigger: el.closest('.line'), start: 'top 88%', once: true },
          })
        })
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: EASE,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          })
        })
      }

      /* ledger counters */
      root.querySelectorAll<HTMLElement>('.ledger-num').forEach((el) => {
        const target = +el.dataset.count!
        const prefix = el.dataset.prefix || ''
        const suffix = el.dataset.suffix || ''
        const plain = el.hasAttribute('data-plain')
        const fmt = (v: number) =>
          prefix + (plain ? Math.round(v) : Math.round(v).toLocaleString('en-IN')) + suffix
        if (reduced) {
          el.textContent = fmt(target)
          return
        }
        const obj = { v: 0 }
        ScrollTrigger.create({
          trigger: el,
          start: 'top 88%',
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

      /* belief rows: focus follows the reader */
      root.querySelectorAll<HTMLElement>('.belief-row').forEach((row) => {
        if (reduced) {
          row.classList.add('focus')
          return
        }
        ScrollTrigger.create({
          trigger: row,
          start: 'top 72%',
          end: 'bottom 28%',
          toggleClass: { targets: row, className: 'focus' },
        })
      })

      /* method deck: sheets settle back as the next stage covers them */
      if (!reduced) {
        const cards = gsap.utils.toArray<HTMLElement>('.dcard')
        cards.forEach((card, i) => {
          const next = cards[i + 1]
          if (!next) return
          const shade = card.querySelector('.dshade')
          const st = { trigger: next, start: 'top bottom', end: 'top 25%', scrub: true } as const
          gsap.to(card, { scale: 0.95, ease: 'none', scrollTrigger: st })
          gsap.to(shade, { opacity: 0.55, ease: 'none', scrollTrigger: { ...st } })
        })
      }

      /* models: sticky stage follows the active row */
      const rows = gsap.utils.toArray<HTMLElement>('.model-split .model-row')
      const imgs = gsap.utils.toArray<HTMLElement>('.stage-img')
      const activate = (i: number) => {
        rows.forEach((r, j) => r.classList.toggle('focus', j === i))
        imgs.forEach((img, j) => img.classList.toggle('active', j === i))
      }
      if (reduced) {
        activate(0)
        rows.forEach((r) => r.classList.add('focus'))
      } else {
        rows.forEach((row, i) => {
          ScrollTrigger.create({
            trigger: row,
            start: 'top 60%',
            end: 'bottom 40%',
            onToggle: (self) => self.isActive && activate(i),
          })
          row.addEventListener('mouseenter', () => activate(i))
        })
        activate(0)
      }

      /* GRIDS morph: pan from fragmented to integrated */
      const img = root.querySelector<HTMLElement>('.morph-img')
      const win = root.querySelector<HTMLElement>('.morph-window')
      const layers = gsap.utils.toArray<HTMLElement>('.mlayer')
      if (img && win) {
        if (reduced) {
          gsap.set(img, { xPercent: -40, filter: 'none' })
          gsap.set(layers, { opacity: 1, y: 0 })
          gsap.set('.morph-label.label-a', { opacity: 0 })
          gsap.set('.morph-label.label-b', { opacity: 1 })
        } else {
          gsap.set(img, { filter: 'grayscale(0.7) brightness(0.75)' })
          const tl = gsap.timeline({
            scrollTrigger: { trigger: '.morph-stage', start: 'top top', end: '+=180%', pin: true, scrub: 0.5 },
          })
          const pan = () => {
            const overflow = img.scrollWidth - win.clientWidth
            return overflow > 0 ? -overflow : 0
          }
          tl.to(img, { x: pan, filter: 'grayscale(0) brightness(1)', ease: 'none', duration: 3 }, 0)
            .to('.morph-label.label-a', { opacity: 0, duration: 0.5, ease: EASE }, 1.1)
            .fromTo('.morph-label.label-b', { opacity: 0 }, { opacity: 1, duration: 0.5, ease: EASE }, 1.5)
            .to(layers, { opacity: 1, y: 0, stagger: 0.18, duration: 0.5, ease: EASE }, 2.2)
        }
      }
    },
    { scope, dependencies: [reduced] },
  )

  return (
    <div ref={scope}>

      <main id="top">
        {/* ACT 0 · ORIGIN */}
        <section className="act about-hero" data-act="00" data-act-name={hero.actName} data-hero>
          <AnimatedTitle as="h1" className="about-title" title={hero.title} />
          <div className="about-head">
            <Rich as="p" className="about-sub" html={hero.subtitle} />
            <div className="about-intro">
              <p className="reveal">{hero.intro}</p>
              <ul className="sector-chips reveal">
                {hero.sectorChips.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="hero-band reveal">
            <div className="hero-band-img" style={{ backgroundImage: `url(${asset(hero.heroImage)})` }} />
          </div>
          <div className="ledger reveal">
            {hero.ledger.map((item, i) => (
              <div className="ledger-item" key={i}>
                <span
                  className="ledger-num"
                  data-count={item.value}
                  {...(item.prefix ? { 'data-prefix': item.prefix } : {})}
                  {...(item.suffix ? { 'data-suffix': item.suffix } : {})}
                  {...(item.plain ? { 'data-plain': '' } : {})}
                >
                  0
                </span>
                <span className="ledger-label">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ACT 1 · BELIEF */}
        <section className="act act-belief" data-act="01" data-act-name={belief.actName}>
          <p className="belief-kicker reveal">{belief.kicker}</p>
          <div className="belief-triptych">
            {belief.rows.map((r) => (
              <div className="belief-row" key={r.num}>
                <span className="belief-num">{r.num}</span>
                <h2 className="belief-line">
                  <span className="line">
                    <span className="line-inner" dangerouslySetInnerHTML={{ __html: r.line }} />
                  </span>
                </h2>
                <p className="belief-note">{r.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ACT 2 · METHOD */}
        <section className="act act-method" id="method" data-act="02" data-act-name={method.actName}>
          <div className="grids-head">
            <AnimatedTitle as="h2" className="section-title" title={method.title} />
            <p className="section-copy reveal">{method.copy}</p>
          </div>
          <div className="deck">
            {method.cards.map((c, i) => (
              <article className="dcard" key={i}>
                <div className="dshade" aria-hidden="true" />
                <span className="dcard-ghost">{pad(i + 1)}</span>
                <div className="dcard-left">
                  <img className="step-icon" src={asset(c.icon)} alt="" loading="lazy" decoding="async" />
                  <span className="dcard-stage">{c.stage}</span>
                  <h3 className="dcard-title" dangerouslySetInnerHTML={{ __html: c.title }} />
                </div>
                <div className="dcard-right">
                  <p>{c.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ACT 3 · MODELS */}
        <section className="act act-models" id="models" data-act="03" data-act-name={models.actName}>
          <div className="grids-head">
            <AnimatedTitle as="h2" className="section-title" title={models.title} />
            <p className="section-copy reveal">{models.copy}</p>
          </div>
          <div className="model-split">
            <div className="model-index">
              {models.rows.map((r) => (
                <article className="model-row reveal" key={r.num}>
                  <img className="model-icon" src={asset(r.icon)} alt="" loading="lazy" decoding="async" />
                  <div className="model-body">
                    <span className="model-num">{r.num}</span>
                    <h3 className="model-title">{r.title}</h3>
                    <p className="model-desc">{r.desc}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="model-stage" aria-hidden="true">
              <div className="stage-frame">
                {models.rows.map((r, i) => (
                  <div
                    className={`stage-img${i === 0 ? ' active' : ''}`}
                    key={i}
                    style={{ backgroundImage: `url(${asset(r.image)})` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ACT 4 · ECOSYSTEM */}
        <section className="act act-eco" data-act="04" data-act-name={ecosystem.actName}>
          <div className="grids-head">
            <AnimatedTitle as="h2" className="section-title" title={ecosystem.title} />
            <p className="section-copy reveal">{ecosystem.copy}</p>
          </div>
          <div className="eco-band">
            {ecosystem.tiles.map((t) => (
              <Link className="eco-tile reveal" href={route(t.href)} key={t.logoAlt}>
                <div className="eco-img" style={{ backgroundImage: `url(${asset(t.image)})` }} />
                <div className="eco-info">
                  <p>{t.text}</p>
                  <span className="eco-more">
                    {t.moreLabel} <span className="arrow">→</span>
                  </span>
                </div>
                <img className="eco-logo" src={asset(t.logo)} alt={t.logoAlt} loading="lazy" decoding="async" />
              </Link>
            ))}
          </div>
        </section>

        {/* ACT 5 · GRIDS morph */}
        <section className="act act-morph" id="grids-deep" data-act="05" data-act-name={grids.actName}>
          <div className="grids-head">
            <AnimatedTitle as="h2" className="section-title" title={grids.title} />
            <p className="section-copy reveal">{grids.copy}</p>
          </div>
          <div className="morph-stage">
            <div className="morph-window">
              <img className="morph-img" src={asset(grids.morphImage)} alt="" />
              <div className="morph-label label-a">
                <h4>{grids.labelA.title}</h4>
                <p>{grids.labelA.text}</p>
              </div>
              <div className="morph-label label-b">
                <h4>{grids.labelB.title}</h4>
                <p>{grids.labelB.text}</p>
              </div>
            </div>
            <ul className="morph-layers">
              {grids.layers.map((l) => (
                <li className="mlayer" key={l.num}>
                  <img className="mlayer-icon" src={asset(l.icon)} alt="" loading="lazy" decoding="async" />
                  <i>{l.num}</i>
                  <strong>{l.title}</strong>
                  <span>{l.subtitle}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CLOSE */}
        <ClosingBridge
          settings={settings}
          className="about-close"
          dataAct="06"
          dataActName="Invitation"
        />
      </main>
    </div>
  )
}
