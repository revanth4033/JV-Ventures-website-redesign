'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { AnimatedTitle } from '@/components/AnimatedTitle'
import { Rich } from '@/components/Rich'
import { useSmoothScroll } from '@/components/SmoothScroll'
import { asset, route } from '@/content'
import type { DeckSlide, HomePage, SiteSettings } from '@/content/types'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'

const pad = (n: number) => String(n).padStart(2, '0')
const SOI_CLASS = ['t-edu', 't-rx', 't-care', 't-pod']

// Give a CSS-background image an accessible name without converting it to <img>
// (keeps the layout/parallax/clarity unchanged). Decorative when no alt is set.
const imgA11y = (alt?: string) => (alt ? { role: 'img' as const, 'aria-label': alt } : {})

function Slide({ slide, arrow }: { slide: DeckSlide; arrow: string }) {
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
                <span className="arrow">{arrow}</span>
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
                  {...imgA11y(s.alt)}
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
            <div className="fb-img" {...imgA11y(slide.backgroundImageAlt)} style={{ backgroundImage: `url(${asset(slide.backgroundImage)})` }} />
            <div className="fb-veil eco-veil" />
          </div>
          <div className="slide-content eco-overlay">
            {slide.kicker && <span className="slide-kicker">{slide.kicker}</span>}
            <AnimatedTitle as="h2" className="slide-title" title={slide.title} />
            {slide.copy && <Rich as="p" className="slide-copy" html={slide.copy} />}
            {slide.cta && (
              <Link className="btn-primary slide-cta" href={route(slide.cta.href)}>
                {slide.cta.label}
                <span className="arrow">{arrow}</span>
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
                  <span className="arrow">{arrow}</span>
                </Link>
              )}
            </div>
          </div>
          <div className="slide-visual plat-strips">
            {slide.strips?.map((st, i) => (
              <Link className={`strip${i === 0 ? ' open' : ''}`} href={route(st.href)} key={st.tab}>
                <div className="strip-img" {...imgA11y(st.imageAlt)} style={{ backgroundImage: `url(${asset(st.image)})` }} />
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

export function Home({ home, settings }: { home: HomePage; settings: SiteSettings }) {
  const scope = useRef<HTMLDivElement>(null)
  const { lenis, reduced } = useSmoothScroll()
  // Lenis is created in SmoothScroll's post-mount effect, so it's null when this
  // component's GSAP effect first runs. We keep it in a ref (updated every render)
  // and read it through the ref inside the effect, so the snap always uses the live
  // instance WITHOUT re-running the whole effect — re-running would leave a second
  // wheel listener active and advance two sections per swipe.
  const lenisRef = useRef(lenis)
  useEffect(() => {
    lenisRef.current = lenis
  }, [lenis])
  const { slides, railChapters, deckActName, deckActIndex } = home.deck
  const N = slides.length
  const arrow = settings.ui?.ctaArrow || '→'

  useGSAP(
    () => {
      const root = scope.current!
      const stage = root.querySelector<HTMLElement>('.deck-stage')
      const track = root.querySelector<HTMLElement>('.deck-track')
      if (!stage || !track) return

      const slideEls = gsap.utils.toArray<HTMLElement>('.slide')
      const chapters = gsap.utils.toArray<HTMLElement>('.rail-ch')
      const counterEl = root.querySelector<HTMLElement>('#deck-cur')!
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

      // discrete deck: each scroll gesture advances exactly one slide and
      // always lands on a full slide (no half-and-half resting state).
      const STEPS = N - 1

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: '+=' + STEPS * 100 + '%',
          pin: '.deck-viewport',
          scrub: true,
          onUpdate: (self) => {
            activate(Math.round(self.progress * STEPS))
            gsap.set('.rail-fill', { scaleX: self.progress })
          },
        },
      })

      tl.to(track, { xPercent: -100 * ((N - 1) / N), ease: 'none', duration: STEPS }, 0)

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

      // ──────────────────────────────────────────────────────────────────────
      // SAFE section snap — cannot freeze, because it never blocks input.
      //
      // The user ALWAYS scrolls completely freely: we never preventDefault a wheel
      // event, never lock Lenis, never stop Lenis. The deck scrubs with the scroll
      // as it always has. The ONLY thing we add is: a short moment AFTER scrolling
      // settles, if the deck has come to rest between sections, we gently ease it
      // onto the nearest section with a plain (unlocked) scrollTo — which any fresh
      // scroll immediately overrides. Nothing here can ever wedge or freeze scroll.
      // ──────────────────────────────────────────────────────────────────────
      const span = () => st.end - st.start
      const yOf = (i: number) => st.start + (span() * Math.max(0, Math.min(N - 1, i))) / STEPS
      // Read Lenis' TARGET scroll (where the gesture is heading) — not the current
      // animated position. We snap ~90ms after the wheel, when Lenis has barely begun
      // lerping, so lenis.scroll still reads near-zero movement; lenis.targetScroll
      // already reflects the whole gesture, so this reads intent rather than the
      // half-played-out animation. Falls back to the animated position if unavailable.
      const here = () => {
        const l = lenisRef.current
        if (!l) return st.scroll()
        const t = (l as unknown as { targetScroll?: number }).targetScroll
        return typeof t === 'number' ? t : l.scroll
      }

      // `base` is the section we last settled on — the anchor for DIRECTIONAL
      // snapping, so even a slight scroll in a direction commits to the NEXT section
      // that way (rather than snapping back to the nearest, which would ignore a
      // gentle swipe). It is the only state we keep, and it never blocks scrolling.
      let base = 0
      // Set whenever the scroll is outside the deck (closing section / footer / very
      // top). The first settle AFTER coming back in lands on the NEAREST section, so
      // re-entering up from the footer rests on slide 4 instead of skipping it.
      let wasOutside = false
      // Direction of the most recent wheel (+1 down, −1 up). A slow scroll is a series
      // of small notches, each individually below the "advance" threshold; without a
      // direction memory the snap pulls every one back to the current section and the
      // deck never advances (it visibly jitters between two slides — the "stuck"
      // report). With it, any movement THE WAY YOU ARE SCROLLING commits to the next
      // section, so even slow notches step forward cleanly.
      let lastDir = 0
      const easeToSection = (i: number) => {
        base = Math.max(0, Math.min(N - 1, i))
        const y = yOf(base)
        // force:true is essential — we snap right after a wheel, while Lenis still
        // considers the user "actively scrolling" and would otherwise SILENTLY DROP a
        // normal scrollTo. force overrides that guard. (It is NOT `lock`: it forces
        // this one scroll to happen, then releases — it never blocks future input.)
        const l = lenisRef.current
        if (l) l.scrollTo(y, { duration: 0.35, force: true })
        else window.scrollTo({ top: y, behavior: 'smooth' })
      }

      // After scrolling has been quiet for a beat, settle onto a section.
      //  • Outside the deck → just remember which edge we're on (for re-entry).
      //  • A nudge (≥ TH of a section) away from `base` → advance ONE section that way.
      //  • A big move (> 1 section) → land on the nearest section.
      //  • Barely moved → stay put.
      // Because we only ever issue a plain (unlocked) scrollTo here, a fresh scroll
      // instantly overrides it — nothing can wedge or freeze.
      let snapTimer: ReturnType<typeof setTimeout> | undefined
      const snapToNearest = () => {
        const s = span()
        if (s <= 0) return
        const y = here()
        if (y < st.start || y > st.end) {
          wasOutside = true
          base = y >= st.end ? N - 1 : 0
          return
        }
        const cur = ((y - st.start) / s) * STEPS // fractional section position
        let target: number
        if (wasOutside) {
          // First settle after re-entering → land on the nearest section (so we
          // never skip slide 4 when coming back up from the footer / closing block).
          target = Math.round(cur)
        } else {
          const delta = cur - base
          const MICRO = 0.04 // ~36px of a 900px section — a deliberate (not noise) nudge
          if (Math.abs(delta) > 1) {
            target = Math.round(cur) // moved more than a full section → land on nearest
          } else if (Math.abs(delta) >= 0.5) {
            target = base + (delta > 0 ? 1 : -1) // crossed halfway → advance that way
          } else if (lastDir !== 0 && Math.sign(delta) === lastDir && Math.abs(delta) >= MICRO) {
            // small but deliberate movement in the scroll direction → commit forward
            // instead of snapping back (this is what fixes the slow-scroll "stuck").
            target = base + lastDir
          } else {
            target = base // noise / barely moved → hold the current section
          }
        }
        wasOutside = false
        target = Math.max(0, Math.min(N - 1, target))
        base = target
        if (Math.abs(y - yOf(target)) > 6) easeToSection(target)
      }
      // Trigger: fire 90ms after the LAST wheel event. `passive: true` means this can
      // never block scrolling — it only observes. Snapping off the wheel gesture (not
      // the slow-decaying scroll stream) lets the snap override Lenis' momentum and
      // land decisively right after you stop, instead of waiting ~1s for momentum to
      // bleed off — which is what stranded the deck between sections on faster swipes
      // and coming back up from the footer.
      //
      // We deliberately bind ONLY to wheel. Our own easeToSection() scrolls
      // programmatically, which does NOT emit wheel events, so the snap animation can
      // never re-trigger itself mid-flight and reverse direction. (A scroll-stream
      // backup was tried and removed — it fired during the snap's own animation,
      // saw the deck between sections, and fought it back the other way.)
      const onWheelSnap = (e: WheelEvent) => {
        if (e.deltaY) lastDir = Math.sign(e.deltaY)
        clearTimeout(snapTimer)
        snapTimer = setTimeout(snapToNearest, 90)
      }
      window.addEventListener('wheel', onWheelSnap, { passive: true })

      // Chapter rail click → ease to that section.
      const onChapterClick = (e: Event) => easeToSection(+(e.currentTarget as HTMLElement).dataset.i!)
      chapters.forEach((c) => c.addEventListener('click', onChapterClick))

      // hover a platform strip (slide 04) to fully expand it
      const onStripEnter = (e: Event) => openStrip(stripEls.indexOf(e.currentTarget as HTMLElement))
      stripEls.forEach((s) => s.addEventListener('mouseenter', onStripEnter))

      // Keyboard: arrow / page keys ease to the adjacent section when the deck is on
      // screen and the user isn't typing in a control. Keys are discrete, so the
      // preventDefault here can never interfere with continuous wheel scrolling.
      const onKey = (e: KeyboardEvent) => {
        const y = here()
        if (y < st.start - 2 || y > st.end + 2) return
        const t = e.target as HTMLElement | null
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName))) return
        const cur = Math.max(0, Math.min(N - 1, Math.round(((y - st.start) / Math.max(1, span())) * STEPS)))
        if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) {
          if (cur < N - 1) {
            e.preventDefault()
            easeToSection(cur + 1)
          }
        } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
          if (cur > 0) {
            e.preventDefault()
            easeToSection(cur - 1)
          }
        }
      }
      window.addEventListener('keydown', onKey)

      // live-preview: jump to a slide when the admin editor switches tabs
      const onGotoSlide = (e: Event) => easeToSection((e as CustomEvent<{ index: number }>).detail?.index ?? 0)
      window.addEventListener('jv:goto-slide', onGotoSlide as EventListener)

      activate(0)

      return () => {
        window.removeEventListener('keydown', onKey)
        chapters.forEach((c) => c.removeEventListener('click', onChapterClick))
        stripEls.forEach((s) => s.removeEventListener('mouseenter', onStripEnter))
        window.removeEventListener('jv:goto-slide', onGotoSlide as EventListener)
        window.removeEventListener('wheel', onWheelSnap)
        clearTimeout(snapTimer)
      }
    },
    // Effect runs ONCE per [reduced, N] — NOT on lenis change (it's read live via
    // lenisRef inside, so no re-run is needed and we never duplicate the wheel
    // listener). lenisRef solves the null-at-first-run problem; see its declaration.
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
      <section className="act deck-stage" id="deck" data-act={deckActIndex || '00'} data-act-name={deckActName}>
        <div className="deck-viewport">
          <div className="deck-track">
            {slides.map((slide) => (
              <Slide slide={slide} arrow={arrow} key={slide.id} />
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
