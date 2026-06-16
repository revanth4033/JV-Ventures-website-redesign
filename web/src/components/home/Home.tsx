'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'

import { AnimatedTitle } from '@/components/AnimatedTitle'
import { Rich } from '@/components/Rich'
import { useSmoothScroll } from '@/components/SmoothScroll'
import { asset, route } from '@/content'
import type { DeckSlide, HomePage } from '@/content/types'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'

const pad = (n: number) => String(n).padStart(2, '0')
const SOI_CLASS = ['t-edu', 't-rx', 't-care', 't-pod']

function Slide({ slide }: { slide: DeckSlide }) {
  switch (slide.id) {
    case 'investing':
      return (
        <article className="slide" id="s-investing">
          <div className="slide-content">
            {slide.kicker && <span className="slide-kicker">{slide.kicker}</span>}
            <AnimatedTitle as="h1" className="slide-title" title={slide.title} />
            {slide.copy && <Rich as="p" className="slide-copy" html={slide.copy} />}
            {slide.cta && (
              <Link className="btn-primary slide-cta" href={route(slide.cta.href)}>
                {slide.cta.label}
                <span className="arrow">→</span>
              </Link>
            )}
          </div>
          <div className="slide-visual">
            <div className="soi-visual" aria-hidden="true">
              <div className="soi-rings">
                <div className="ring r1" />
                <div className="ring r2 dashed" />
                <div className="ring r3" />
                <div className="soi-core">
                  {slide.coreMark && <img className="core-mark" src={asset(slide.coreMark)} alt="" />}
                </div>
                {slide.soiTiles?.map((t, i) => (
                  <div className={`soi-tile ${SOI_CLASS[i]}`} key={t.label}>
                    <div className="tile-img" style={{ backgroundImage: `url(${asset(t.image)})` }} />
                    <span className="tile-label">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      )

    case 'impact':
      return (
        <article className="slide slide--impact" id="s-impact" data-vpx="6">
          <div className="slide-visual fullbleed">
            <div className="fb-quad">
              {slide.backgroundSlices?.map((s, i) => (
                <div
                  className="fb-slice"
                  key={i}
                  style={{
                    backgroundImage: `url(${asset(s.image)})`,
                    ...(s.position ? { backgroundPosition: s.position } : {}),
                  }}
                />
              ))}
            </div>
            <div className="fb-veil" />
          </div>
          <div className="slide-content impact-wall">
            {slide.kicker && <span className="slide-kicker">{slide.kicker}</span>}
            <AnimatedTitle as="h2" className="slide-title" title={slide.title} />
            <div className="num-row">
              {slide.stats?.map((s, i) => (
                <div className="stat-card nstat" key={i} data-count={s.value} data-suffix={s.suffix || ''}>
                  <span className="stat-num">{`0${s.suffix || ''}`}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      )

    case 'ecosystems':
      return (
        <article className="slide slide--eco" id="s-ecosystems" data-vpx="6">
          <div className="slide-visual fullbleed">
            <div className="fb-img" style={{ backgroundImage: `url(${asset(slide.backgroundImage)})` }} />
            <div className="fb-veil eco-veil" />
          </div>
          <div className="slide-content eco-overlay">
            {slide.kicker && <span className="slide-kicker">{slide.kicker}</span>}
            <AnimatedTitle as="h2" className="slide-title" title={slide.title} />
            {slide.copy && <Rich as="p" className="slide-copy" html={slide.copy} />}
            {slide.cta && (
              <Link className="btn-primary slide-cta" href={route(slide.cta.href)}>
                {slide.cta.label}
                <span className="arrow">→</span>
              </Link>
            )}
          </div>
        </article>
      )

    case 'platforms':
      return (
        <article className="slide slide--plat" id="s-platforms">
          <div className="slide-content plat-head">
            <div>
              {slide.kicker && <span className="slide-kicker">{slide.kicker}</span>}
              <AnimatedTitle as="h2" className="slide-title" title={slide.title} />
            </div>
            <div className="plat-head-right">
              {slide.copy && <Rich as="p" className="slide-copy" html={slide.copy} />}
              {slide.cta && (
                <Link className="btn-primary slide-cta" href={route(slide.cta.href)}>
                  {slide.cta.label}
                  <span className="arrow">→</span>
                </Link>
              )}
            </div>
          </div>
          <div className="slide-visual plat-strips">
            {slide.strips?.map((st, i) => (
              <Link className={`strip${i === 0 ? ' open' : ''}`} href={route(st.href)} key={st.tab}>
                <div className="strip-img" style={{ backgroundImage: `url(${asset(st.image)})` }} />
                <span className="strip-tab">{st.tab}</span>
                <img className="strip-logo" src={asset(st.logo)} alt={st.logoAlt} />
                <div className="strip-stat">
                  <strong>{st.statStrong}</strong>
                  <span>{st.statSpan}</span>
                  <p className="strip-desc">{st.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </article>
      )

    default:
      return null
  }
}

export function Home({ home }: { home: HomePage }) {
  const scope = useRef<HTMLDivElement>(null)
  const { lenis, reduced } = useSmoothScroll()
  const { slides, railChapters, deckActName } = home.deck
  const N = slides.length

  useGSAP(
    () => {
      const root = scope.current!
      const stage = root.querySelector<HTMLElement>('.deck-stage')
      const track = root.querySelector<HTMLElement>('.deck-track')
      if (!stage || !track) return

      const slideEls = gsap.utils.toArray<HTMLElement>('.slide')
      const chapters = gsap.utils.toArray<HTMLElement>('.rail-ch')
      const counterEl = root.querySelector<HTMLElement>('#deck-cur')!
      const TOTAL = N - 1 + 3
      const counted = new Set<Element>()
      let current = -1

      const stripEls = gsap.utils.toArray<HTMLElement>('.strip')
      const stripWrap = root.querySelector<HTMLElement>('.plat-strips')
      const wideScreen = window.matchMedia('(min-width: 1024px)')
      let stripIdx = -1
      const openStrip = (i: number) => {
        if (i === stripIdx || !stripEls.length) return
        stripIdx = i
        stripEls.forEach((st, j) => st.classList.toggle('open', j === i))
        if (wideScreen.matches && stripWrap)
          stripWrap.style.gridTemplateColumns = stripEls
            .map((_, j) => (j === i ? '3.4fr' : '0.55fr'))
            .join(' ')
      }
      openStrip(0)

      const countStats = () => {
        root.querySelectorAll<HTMLElement>('.stat-card').forEach((card) => {
          if (counted.has(card)) return
          counted.add(card)
          const numEl = card.querySelector<HTMLElement>('.stat-num')!
          const target = +card.dataset.count!
          const suffix = card.dataset.suffix || ''
          const obj = { v: 0 }
          gsap.to(obj, {
            v: target,
            duration: reduced ? 0 : 1.2,
            ease: 'power2.out',
            onUpdate: () => (numEl.textContent = Math.round(obj.v).toLocaleString('en-IN') + suffix),
          })
        })
      }

      const activate = (i: number) => {
        if (i === current) return
        current = i
        slideEls.forEach((s, j) => s.classList.toggle('active', j === i))
        chapters.forEach((c, j) => c.classList.toggle('active', j === i))
        counterEl.textContent = pad(i + 1)
        if (i === 1) countStats()
      }

      const MOBILE = window.matchMedia('(max-width: 1023px)').matches

      if (reduced || MOBILE) {
        slideEls.forEach((s) => s.classList.add('active'))
        stripEls.forEach((st) => st.classList.add('open'))
        if (reduced) {
          root.querySelectorAll<HTMLElement>('.stat-card').forEach((card) => {
            card.querySelector<HTMLElement>('.stat-num')!.textContent =
              (+card.dataset.count!).toLocaleString('en-IN') + (card.dataset.suffix || '')
          })
        } else {
          // counters animate when each card scrolls into view
          root.querySelectorAll<HTMLElement>('.stat-card').forEach((card) => {
            ScrollTrigger.create({
              trigger: card,
              start: 'top 85%',
              once: true,
              onEnter: () => {
                const numEl = card.querySelector<HTMLElement>('.stat-num')!
                const target = +card.dataset.count!
                const suffix = card.dataset.suffix || ''
                const obj = { v: 0 }
                gsap.to(obj, {
                  v: target,
                  duration: 1.2,
                  ease: 'power2.out',
                  onUpdate: () =>
                    (numEl.textContent = Math.round(obj.v).toLocaleString('en-IN') + suffix),
                })
              },
            })
          })
        }
        return
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: '+=' + (N * 100 + 300) + '%',
          pin: '.deck-viewport',
          scrub: true,
          onUpdate: (self) => {
            const t = self.progress * TOTAL
            const i = t < N - 1 ? Math.round(t) : N - 1
            activate(i)
            if (t >= N - 1)
              openStrip(Math.min(stripEls.length - 1, Math.floor((t - (N - 1)) / 0.75)))
            gsap.set('.rail-fill', { scaleX: self.progress })
          },
        },
      })

      tl.to(track, { xPercent: -100 * ((N - 1) / N), ease: 'none', duration: N - 1 }, 0)
      tl.to({}, { duration: TOTAL - (N - 1) }, N - 1)

      slideEls.forEach((slide, i) => {
        const content = slide.querySelector('.slide-content')
        const visual = slide.querySelector<HTMLElement>('.slide-visual')
        const w0 = Math.max(0, i - 1)
        const w1 = Math.min(N - 1, i + 1)
        if (content)
          tl.fromTo(
            content,
            { xPercent: i === 0 ? 0 : 10 },
            { xPercent: i === N - 1 ? 0 : -10, ease: 'none', duration: w1 - w0 },
            w0,
          )
        const amp = visual?.closest('.slide')?.getAttribute('data-vpx')
          ? +visual!.closest('.slide')!.getAttribute('data-vpx')!
          : 22
        if (visual)
          tl.fromTo(
            visual,
            { xPercent: i === 0 ? 0 : amp },
            { xPercent: i === N - 1 ? 0 : -amp, ease: 'none', duration: w1 - w0 },
            w0,
          )
      })

      const st = tl.scrollTrigger!
      const jumpTo = (i: number) => {
        const y = st.start + ((st.end - st.start) * i) / TOTAL
        lenis ? lenis.scrollTo(y, { duration: 1.1 }) : window.scrollTo({ top: y, behavior: 'smooth' })
      }
      const onChapterClick = (e: Event) =>
        jumpTo(+(e.currentTarget as HTMLElement).dataset.i!)
      chapters.forEach((c) => c.addEventListener('click', onChapterClick))

      const onKey = (e: KeyboardEvent) => {
        if (!st.isActive) return
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault()
          jumpTo(Math.min(N - 1, current + 1))
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          jumpTo(Math.max(0, current - 1))
        }
      }
      window.addEventListener('keydown', onKey)

      activate(0)

      return () => {
        chapters.forEach((c) => c.removeEventListener('click', onChapterClick))
        window.removeEventListener('keydown', onKey)
      }
    },
    { scope, dependencies: [reduced, N] },
  )

  // SOI sphere: tiles orbit the core
  useGSAP(
    () => {
      const rings = scope.current?.querySelector<HTMLElement>('.soi-rings')
      if (!rings) return
      // even orbit: same radius, angles 90° apart (top / right / bottom / left)
      const defs = [
        { sel: '.t-edu', r: 0.42, a: -90 },
        { sel: '.t-rx', r: 0.42, a: 0 },
        { sel: '.t-care', r: 0.42, a: 90 },
        { sel: '.t-pod', r: 0.42, a: 180 },
      ]
      const orbiters = defs
        .map((d) => ({ ...d, el: scope.current!.querySelector<HTMLElement>(d.sel) }))
        .filter((o) => o.el) as { el: HTMLElement; r: number; a: number }[]
      if (!orbiters.length) return
      orbiters.forEach((o) =>
        gsap.set(o.el, { left: '50%', top: '50%', right: 'auto', bottom: 'auto', xPercent: -50, yPercent: -50 }),
      )
      const state = { spin: 0 }
      const place = () => {
        const R = rings.offsetWidth / 2
        orbiters.forEach((o) => {
          const a = ((o.a + state.spin) * Math.PI) / 180
          gsap.set(o.el, { x: Math.cos(a) * R * 2 * o.r, y: Math.sin(a) * R * 2 * o.r })
        })
      }
      place()
      if (!reduced) gsap.to(state, { spin: 360, duration: 70, repeat: -1, ease: 'none', onUpdate: place })
      window.addEventListener('resize', place)
      return () => window.removeEventListener('resize', place)
    },
    { scope, dependencies: [reduced] },
  )

  return (
    <div ref={scope}>
      <section className="act deck-stage" id="deck" data-act="00" data-act-name={deckActName}>
        <div className="deck-viewport">
          <div className="deck-track">
            {slides.map((slide) => (
              <Slide slide={slide} key={slide.id} />
            ))}
          </div>
          <div className="deck-rail">
            <div className="rail-chapters">
              {railChapters.map((c, i) => (
                <button className={`rail-ch${i === 0 ? ' active' : ''}`} data-i={i} key={c}>
                  <i>{pad(i + 1)}</i>
                  {c}
                </button>
              ))}
            </div>
            <div className="rail-line">
              <div className="rail-fill" />
            </div>
            <span className="deck-counter">
              <span id="deck-cur">01</span> / {pad(N)}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
