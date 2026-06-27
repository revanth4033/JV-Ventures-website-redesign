'use client'

import { type FormEvent, useRef, useState } from 'react'

import { AnimatedTitle } from '@/components/AnimatedTitle'
import { ClosingBridge } from '@/components/ClosingBridge'
import { OfficeMap } from '@/components/contact/OfficeMap'
import { useSmoothScroll } from '@/components/SmoothScroll'
import type { ContactPage, SiteSettings } from '@/content/types'
import { EASE, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'

import { submitEnquiry } from '@/app/(frontend)/contact/actions'

export function Contact({ contact, settings }: { contact: ContactPage; settings: SiteSettings }) {
  const scope = useRef<HTMLDivElement>(null)
  const { reduced } = useSmoothScroll()
  const {
    hero, email, enquiryTypes, offices, presence, formIntro, mapTitle, mapCopy, form,
    bodyActName, bodyActIndex, mapActName, mapActIndex, emailLabel, officesLabel, presenceLabel,
  } = contact
  const arrow = settings.ui?.ctaArrow || '→'
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

  const [enquiry, setEnquiry] = useState(enquiryTypes[0])
  const [sent, setSent] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return
    const data = new FormData(e.currentTarget)
    const fn = String(data.get('firstName') || '').trim()
    const em = String(data.get('email') || '').trim()
    const msg = String(data.get('message') || '').trim()
    setError('')
    // Client-side validation using the CMS-editable messages.
    if (!fn) return setError(form?.errorName || 'Please enter your first name.')
    if (!EMAIL_RE.test(em)) return setError(form?.errorEmail || 'Please enter a valid email address.')
    if (!msg) return setError(form?.errorMessage || 'Please enter a message.')
    setSubmitting(true)
    try {
      const res = await submitEnquiry({
        enquiry: String(data.get('enquiry') || ''),
        firstName: fn,
        lastName: String(data.get('lastName') || ''),
        email: em,
        phone: String(data.get('phone') || ''),
        company: String(data.get('company') || ''),
        message: msg,
      })
      if (res.ok) {
        setFirstName(fn)
        setSent(true)
      } else {
        setError(res.error || form?.errorGeneric || 'Something went wrong. Please try again.')
      }
    } catch {
      setError(form?.errorNetwork || 'Network error. Please try again, or email us directly.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div ref={scope}>
      <main id="top">
        {/* HERO */}
        <section className="act contact-hero" data-cms-section="hero" data-act={hero.actIndex || '01'} data-act-name={hero.actName} data-hero>
          <span className="contact-kicker">{hero.kicker}</span>
          <AnimatedTitle as="h1" className="contact-title" title={hero.title} />
          <p className="contact-intro reveal">{hero.intro}</p>
        </section>

        {/* FORM + DETAILS */}
        <section className="act contact-body" data-cms-section="details" data-act={bodyActIndex || '02'} data-act-name={bodyActName || 'Get in touch'}>
          <div className="contact-layout">
            {/* form */}
            <div className="contact-form-wrap">
              <span className="contact-form-intro reveal">{formIntro}</span>
              {sent ? (
                <div className="contact-success" role="status">
                  <span className="success-mark" aria-hidden="true">
                    {arrow}
                  </span>
                  <h2>
                    {form?.successTitle || 'Thank you'}{firstName ? `, ${firstName}` : ''}.
                  </h2>
                  <p>
                    {form?.successBody ||
                      'Your message is on its way. Someone from the team will be in touch shortly — usually within two business days.'}
                  </p>
                  <button type="button" className="success-reset" onClick={() => setSent(false)}>
                    {form?.resetLabel || 'Send another message'}
                  </button>
                </div>
              ) : (
                <form className="contact-form" data-cms-section="form" onSubmit={onSubmit} noValidate={false}>
                  <div className="enquiry">
                    <span className="field-label">{form?.enquiryLabel || 'Enquiry type'}</span>
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

                  <div className="field-row">
                    <label className="field">
                      <span className="field-label">{form?.firstName || 'First name'}</span>
                      <input type="text" name="firstName" autoComplete="given-name" required />
                      <span className="field-line" aria-hidden="true" />
                    </label>
                    <label className="field">
                      <span className="field-label">{form?.lastName || 'Last name'}</span>
                      <input type="text" name="lastName" autoComplete="family-name" required />
                      <span className="field-line" aria-hidden="true" />
                    </label>
                  </div>
                  <div className="field-row">
                    <label className="field">
                      <span className="field-label">{form?.email || 'Email'}</span>
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        aria-invalid={error.toLowerCase().includes('email') || undefined}
                      />
                      <span className="field-line" aria-hidden="true" />
                    </label>
                    <label className="field">
                      <span className="field-label">{form?.phone || 'Phone'}</span>
                      <input type="tel" name="phone" autoComplete="tel" />
                      <span className="field-line" aria-hidden="true" />
                    </label>
                  </div>
                  <label className="field">
                    <span className="field-label">{form?.company || 'Company'}</span>
                    <input type="text" name="company" autoComplete="organization" />
                    <span className="field-line" aria-hidden="true" />
                  </label>

                  <label className="field">
                    <span className="field-label">{form?.message || 'Your message'}</span>
                    <textarea name="message" rows={4} required />
                    <span className="field-line" aria-hidden="true" />
                  </label>

                  {error ? (
                    <p className="contact-error" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <button type="submit" className="contact-submit" disabled={submitting} aria-busy={submitting}>
                    {submitting ? form?.submitting || 'Sending…' : form?.submit || 'Send message'}
                    <span className="arrow" aria-hidden="true">
                      {arrow}
                    </span>
                  </button>
                </form>
              )}
            </div>

            {/* details rail */}
            <aside className="contact-rail">
              <div className="rail-block reveal">
                <span className="rail-label">{emailLabel || 'Email'}</span>
                <a className="rail-email" href={`mailto:${email}`}>
                  {email}
                </a>
              </div>
              <div className="rail-block reveal">
                <span className="rail-label">{officesLabel || 'Offices'}</span>
                <ul className="office-list" data-cms-section="offices">
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
                <span className="rail-label">{presenceLabel || 'Presence'}</span>
                <p className="rail-presence">{presence}</p>
              </div>
            </aside>
          </div>
        </section>

        {/* MAP */}
        <section className="act contact-map" data-cms-section="map" data-act={mapActIndex || '03'} data-act-name={mapActName || 'Find us'}>
          <header className="grids-head">
            <h2 className="section-title">
              <span className="line">
                <span className="line-inner">{mapTitle || 'Find us'}</span>
              </span>
            </h2>
            <div className="head-right">
              <p className="section-copy reveal">
                {mapCopy || 'Two offices in Hyderabad, at the heart of India’s deep-tech and lifesciences corridor.'}
              </p>
            </div>
          </header>
          <OfficeMap offices={offices} />
        </section>

        {/* CLOSE */}
        <ClosingBridge settings={settings} dataAct="04" dataActName="Invitation" />
      </main>
    </div>
  )
}
