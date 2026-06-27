'use client'

import Image from 'next/image'
import { useRef } from 'react'

import { AnimatedTitle } from '@/components/AnimatedTitle'
import { ClosingBridge } from '@/components/ClosingBridge'
import { useSmoothScroll } from '@/components/SmoothScroll'
import { asset } from '@/content'
import type { SiteSettings, TeamPage } from '@/content/types'
import { EASE, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'

/** LinkedIn glyph (lucide dropped brand icons in this version) */
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  </svg>
)

/** "Jasmeet Chhabra" -> "JC", "Sai Krishna Narla" -> "SN" */
const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** portrait: real photo when available, elegant monogram fallback otherwise.
 *  When `linkedin` is set, a LinkedIn link reveals over the photo on hover. */
function Portrait({
  name,
  photo,
  photoAlt,
  linkedin,
  className = '',
}: {
  name: string
  photo?: string
  photoAlt?: string
  linkedin?: string
  className?: string
}) {
  return (
    <div className={`portrait${photo ? ' has-photo' : ''} ${className}`.trim()}>
      {photo ? (
        <Image
          src={asset(photo)}
          alt={photoAlt || name}
          fill
          sizes="(max-width: 768px) 45vw, 360px"
          style={{ objectFit: 'cover', objectPosition: 'center 22%' }}
        />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
      {linkedin ? (
        <a
          className="portrait-li"
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name} on LinkedIn`}
        >
          <LinkedInIcon />
        </a>
      ) : null}
    </div>
  )
}

export function Team({ team, settings }: { team: TeamPage; settings: SiteSettings }) {
  const scope = useRef<HTMLDivElement>(null)
  const { reduced } = useSmoothScroll()
  const {
    hero, foundersTitle, foundersActName, foundersActIndex, founders,
    rosterTitle, rosterActName, rosterActIndex, rosterCopy, groups,
  } = team

  // flatten members with their venture for the gallery
  const roster = groups.flatMap((g) => g.members.map((m) => ({ ...m, venture: g.venture })))

  useGSAP(
    () => {
      const root = scope.current!

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
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          })
        })
        // co-founder portraits wipe in (clip + settle)
        gsap.utils.toArray<HTMLElement>('.founder-portrait').forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: 'inset(0 0 100% 0)', scale: 1.06 },
            {
              clipPath: 'inset(0 0 0% 0)',
              scale: 1,
              duration: 1.2,
              ease: EASE,
              scrollTrigger: { trigger: el, start: 'top 86%', once: true },
            },
          )
        })

        // gallery cards rise in, staggered per row
        gsap.utils.toArray<HTMLElement>('.tm-card').forEach((el, i) => {
          gsap.from(el, {
            opacity: 0,
            y: 40,
            duration: 0.8,
            ease: EASE,
            delay: (i % 4) * 0.08,
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          })
        })
      }

      root.querySelectorAll<HTMLElement>('.count-num').forEach((el) => {
        const target = +el.dataset.count!
        if (reduced) {
          el.textContent = String(target)
          return
        }
        const obj = { v: 0 }
        ScrollTrigger.create({
          trigger: el,
          start: 'top 92%',
          once: true,
          onEnter: () =>
            gsap.to(obj, {
              v: target,
              duration: 1.4,
              ease: 'power2.out',
              onUpdate: () => (el.textContent = String(Math.round(obj.v))),
            }),
        })
      })
    },
    { scope, dependencies: [reduced] },
  )

  return (
    <div ref={scope}>
      <main id="top">
        {/* ACT 1 · HERO */}
        <section className="act team-hero" data-cms-section="hero" data-act={hero.actIndex || '01'} data-act-name={hero.actName} data-hero>
          <span className="team-kicker">{hero.kicker}</span>
          <div className="team-hero-row">
            <AnimatedTitle as="h1" className="team-title" title={hero.title} />
            <p className="team-intro reveal">{hero.intro}</p>
          </div>
          {hero.stats?.length ? (
            <ul className="team-hero-stats reveal">
              {hero.stats.map((s) => (
                <li className="team-hero-stat" key={s.label}>
                  <span className="ths-num">
                    <span className="count-num" data-count={s.value}>
                      0
                    </span>
                    {s.suffix ? <span className="ths-suffix">{s.suffix}</span> : null}
                  </span>
                  <span className="ths-label">{s.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* ACT 2 · CO-FOUNDERS */}
        <section className="act team-founders" data-cms-section="founders" data-act={foundersActIndex || '02'} data-act-name={foundersActName || 'Founders'}>
          <header className="team-section-head">
            <h2 className="section-title">
              <span className="line">
                <span className="line-inner">{foundersTitle}</span>
              </span>
            </h2>
          </header>
          <div className="founder-list">
            {founders.map((f, i) => (
              <article className="founder" data-side={i % 2 === 0 ? 'left' : 'right'} key={f.name}>
                <div className="founder-media">
                  <Portrait name={f.name} photo={f.photo} photoAlt={f.photoAlt} linkedin={f.linkedin} className="founder-portrait" />
                </div>
                <div className="founder-body">
                  <span className="founder-role reveal">{f.role}</span>
                  <h3 className="founder-name">
                    <span className="line">
                      <span className="line-inner">{f.name}</span>
                    </span>
                  </h3>
                  <p className="founder-bio reveal">{f.bio}</p>
                  {f.highlights?.length ? (
                    <ul className="founder-highlights reveal">
                      {f.highlights.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ACT 3 · PORTFOLIO LEADERSHIP — every leader shown, editorial stagger */}
        <section className="act team-roster" data-cms-section="roster" data-act={rosterActIndex || '03'} data-act-name={rosterActName || 'Leadership'}>
          <header className="grids-head">
            <h2 className="section-title">
              <span className="line">
                <span className="line-inner">{rosterTitle}</span>
              </span>
            </h2>
            <div className="head-right">
              <p className="section-copy reveal">{rosterCopy}</p>
            </div>
          </header>

          <div className="team-gallery">
            {roster.map((m) => (
              <figure className="tm-card" key={m.name}>
                <Portrait name={m.name} photo={m.photo} photoAlt={m.photoAlt} linkedin={m.linkedin} className="tm-photo" />
                <figcaption>
                  <span className="tm-venture">{m.venture}</span>
                  <h3 className="tm-name">{m.name}</h3>
                  <span className="tm-role">{m.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* CLOSE */}
        <ClosingBridge settings={settings} dataAct="04" dataActName="Invitation" />
      </main>
    </div>
  )
}
