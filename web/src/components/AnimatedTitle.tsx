import type { ElementType } from 'react'

import type { AnimatedTitle as TitleData } from '@/content/types'

const isEm = (emphasis: string | undefined, i: number): boolean => {
  if (!emphasis) return false
  if (emphasis === 'all') return true
  const m = emphasis.match(/^line:(\d+)$/)
  return m ? Number(m[1]) === i : false
}

/**
 * Reproduces the prototype's masked line-reveal markup:
 *   <h_ class><span class="line"><span class="line-inner [em]">text</span></span>…</h_>
 * The reveal animation is driven by each page's GSAP scope (the `.line-inner`
 * tween registered in the page component's useGSAP).
 */
export function AnimatedTitle({
  title,
  as: Tag = 'h2',
  className,
}: {
  title: TitleData
  as?: ElementType
  className?: string
}) {
  return (
    <Tag className={className}>
      {title.lines.map((line, i) => (
        <span className="line" key={i}>
          <span
            className={`line-inner${isEm(title.emphasis, i) ? ' em' : ''}`}
            dangerouslySetInnerHTML={{ __html: line }}
          />
        </span>
      ))}
    </Tag>
  )
}
