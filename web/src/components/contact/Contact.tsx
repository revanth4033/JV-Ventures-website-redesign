'use client'

import { type FormEvent, useRef, useState } from 'react'

import { AnimatedTitle } from '@/components/AnimatedTitle'
import { ClosingBridge } from '@/components/ClosingBridge'
import { useSmoothScroll } from '@/components/SmoothScroll'
import type { ContactPage, SiteSettings } from '@/content/types'
import { EASE, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'

export function Contact({ contact, settings }: { contact: ContactPage; settings: SiteSettings }) {
  const scope = useRef<HTMLDivElement>(null)
  const { reduced } = useSmoothScroll()
  const { hero, email, enquiryTypes, offices, presence, formIntro } = contact

  const [enquiry, setEnquiry] = useState(enquiryTypes[0])
  const [sent, setSent] = useState(false)
  const [firstName, setFirstName] = useState('')

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
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          })
        })
        // form fields rise in, staggered
        gsap.from('.contact-form .field, .contact-form .enquiry, .contact-form .contact-submit', {
          opacity: 0,
          y: 26,
          duration: 0.7,
          ease: EASE,
          stagger: 0.08,
          scrollTrigger: { trigger: '.contact-form', start: 'top 80%', once: true },
        })
      }
    },
    { scope, dependencies: [reduced] },
  )

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setFirstName(String(data.get('firstName') || '').trim())
    setSent(true)
  }

  return (
    <div ref={scope}>
      <main id="top">
        {/* HERO */}
        <section className="act contact-hero" data-act="01" data-act-name={hero.actName} data-hero>
          <span className="contact-kicker">{hero.kicker}</span>
          <AnimatedTitle as="h1" className="contact-title" title={hero.title} />
          <p className="contact-intro reveal">{hero.intro}</p>
        </section>

        {/* FORM + DETAILS */}
        <section className="act contact-body" data-act="02" data-act-name="Get in touch">
          <div className="contact-layout">
            {/* form */}
            <div className="contact-form-wrap">
              <span className="contact-form-intro reveal">{formIntro}</span>
              {sent ? (
                <div className="contact-success" role="status">
                  <span className="success-mark" aria-hidden="true">
                    →
                  </span>
                  <h2>
                    Thank you{firstName ? `, ${firstName}` : ''}.
                  </h2>
                  <p>
                    Your message is on its way. Someone from the team will be in touch shortly — usually
                    within two business days.
                  </p>
                  <button type="button" className="success-reset" onClick={() => setSent(false)}>
                    Send another message
                  </button>
                </div>
              ) : (
                <form className="contact-form" onSubmit={onSubmit} noValidate={false}>
                  <div className="field-row">
                    <label className="field">
                      <span className="field-label">First name</span>
                      <input type="text" name="firstName" autoComplete="given-name" required />
                      <span className="field-line" aria-hidden="true" />
                    </label>
                    <label className="field">
                      <span className="field-label">Last name</span>
                      <input type="text" name="lastName" autoComplete="family-name" required />
                      <span className="field-line" aria-hidden="true" />
                    </label>
                  </div>
                  <div className="field-row">
                    <label className="field">
                      <span className="field-label">Email</span>
                      <input type="email" name="email" autoComplete="email" required />
                      <span className="field-line" aria-hidden="true" />
                    </label>
                    <label className="field">
                      <span className="field-label">Phone</span>
                      <input type="tel" name="phone" autoComplete="tel" />
                      <span className="field-line" aria-hidden="true" />
                    </label>
                  </div>
                  <label className="field">
                    <span className="field-label">Company</span>
                    <input type="text" name="company" autoComplete="organization" />
                    <span className="field-line" aria-hidden="true" />
                  </label>

                  <div className="enquiry">
                    <span className="field-label">Enquiry type</span>
                    <div className="enquiry-chips">
                      {enquiryTypes.map((t) => (
                        <button
                          type="button"
                          key={t}
                          className={`enquiry-chip${t === enquiry ? ' active' : ''}`}
                          onClick={() => setEnquiry(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <input type="hidden" name="enquiry" value={enquiry} />
                  </div>

                  <label className="field">
                    <span className="field-label">Your message</span>
                    <textarea name="message" rows={4} required />
                    <span className="field-line" aria-hidden="true" />
                  </label>

                  <button type="submit" className="contact-submit">
                    Send message
                    <span className="arrow" aria-hidden="true">
                      →
                    </span>
                  </button>
                </form>
              )}
            </div>

            {/* details rail */}
            <aside className="contact-rail">
              <div className="rail-block reveal">
                <span className="rail-label">Email</span>
                <a className="rail-email" href={`mailto:${email}`}>
                  {email}
                </a>
              </div>
              <div className="rail-block reveal">
                <span className="rail-label">Offices</span>
                <ul className="office-list">
                  {offices.map((o) => (
                    <li className="office" key={o.address}>
                      <h3 className="office-city">
                        {o.city}
                        <span className="office-region">{o.region}</span>
                      </h3>
                      <p className="office-address">{o.address}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rail-block reveal">
                <span className="rail-label">Presence</span>
                <p className="rail-presence">{presence}</p>
              </div>
            </aside>
          </div>
        </section>

        {/* MAP */}
        <section className="act contact-map" data-act="03" data-act-name="Find us">
          <header className="grids-head">
            <h2 className="section-title">
              <span className="line">
                <span className="line-inner">Find us</span>
              </span>
            </h2>
            <div className="head-right">
              <p className="section-copy reveal">Two homes in Hyderabad — at the heart of India&rsquo;s deep-tech and lifesciences corridor.</p>
            </div>
          </header>
          <div className="map-grid">
            {offices.map((o) => (
              <figure className="map-card reveal" key={o.address}>
                <iframe
                  className="map-frame"
                  title={`${o.city}, ${o.region}`}
                  loading="lazy"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(o.address)}&z=15&output=embed`}
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <figcaption>
                  <span className="map-city">{o.city}</span>
                  <span className="map-region">{o.region}</span>
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
