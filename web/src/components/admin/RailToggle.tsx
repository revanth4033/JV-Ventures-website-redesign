'use client'

import { Menu } from 'lucide-react'

export function RailToggle() {
  return (
    <button
      className="rail-toggle"
      aria-label="Toggle navigation"
      onClick={() => document.querySelector('.admin-side')?.classList.toggle('open')}
    >
      <Menu strokeWidth={2} />
    </button>
  )
}
