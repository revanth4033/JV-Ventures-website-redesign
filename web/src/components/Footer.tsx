import Link from 'next/link'

import { route } from '@/content'
import type { SiteSettings } from '@/content/types'

export function Footer({ settings }: { settings: SiteSettings }) {
  const { footer } = settings
  const links = footer.links ?? []
  return (
    <footer className="site-footer" data-cms-section="footer">
      <div className="foot-left">
        {links
          .filter((item) => item.label && item.href)
          .map((item) => (
            <Link
              key={item.label}
              href={route(item.href)}
              {...(item.external ? { target: '_blank', rel: 'noopener' } : {})}
            >
              {item.label}
            </Link>
          ))}
      </div>
      <div className="foot-right">
        {footer.locations ? <span>{footer.locations}</span> : null}
        {footer.copyright ? <span className="foot-copyright">{footer.copyright}</span> : null}
      </div>
    </footer>
  )
}
