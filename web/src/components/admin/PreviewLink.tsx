import { SquareArrowOutUpRight } from 'lucide-react'

/** Opens the live public page this editor controls, in a new tab. */
export function PreviewLink({ href, label = 'Preview' }: { href: string; label?: string }) {
  return (
    <a className="btn" href={href} target="_blank" rel="noopener noreferrer">
      <SquareArrowOutUpRight size={15} /> {label}
    </a>
  )
}
