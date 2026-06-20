'use client'

import Image from 'next/image'
import { useRef } from 'react'

import { asset } from '@/content'
import type { SiteSettings } from '@/content/types'
import { useSmoothScroll } from './SmoothScroll'
import { EASE, gsap, useGSAP } from '@/lib/gsap'

export function ClosingBridge({
  settings,
  className = '',
  id = 'contact',
  dataAct,
  dataActName,
}: {
  settings: SiteSettings
  className?: string
  id?: string
  dataAct?: string
  dataActName?: string
}) {
  const { closingQuote, bridgeImage } = settings
  const ref = useRef<HTMLElement>(null)
  const { reduced } = useSmoothScroll()

  useGSAP(
    () => {
      if (reduced) return
      // masked reveal of the quote lines (same grammar as the rest of the site)
      gsap.utils.toArray<HTMLElement>('.close-statement .line-inner').forEach((el) => {
        gsap.to(el, {
          y: 0,
          duration: 1.2,
          ease: EASE,
          scrollTrigger: { trigger: el.closest('.line'), start: 'top 88%', once: true },
        })
      })
      const img = ref.current?.querySelector('.close-bridge img')
      if (img) {
        gsap.to(img, {
          clipPath: 'inset(0 0% 0 0)',
          duration: 1.8,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: ref.current, start: 'top 55%', once: true },
        })
      }
      gsap.from(ref.current!.querySelector('.close-bridge'), {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'top 20%', scrub: 0.4 },
      })
    },
    { scope: ref, dependencies: [reduced] },
  )

  return (
    <section
      ref={ref}
      className={`act act-close ${className}`.trim()}
      id={id}
      data-act={dataAct}
      data-act-name={closingQuote.actName || dataActName}
    >
      <p className="close-statement">
        {closingQuote.lines.map((line, i) => (
          <span className="line" key={i}>
            <span className="line-inner" dangerouslySetInnerHTML={{ __html: line }} />
          </span>
        ))}
      </p>
      <div className="close-bridge" aria-hidden="true">
        <Image src={asset(bridgeImage.src)} alt={bridgeImage.alt || ''} width={2048} height={585} />
      </div>
    </section>
  )
}
