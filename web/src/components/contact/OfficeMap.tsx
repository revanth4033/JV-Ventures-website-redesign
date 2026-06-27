'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef } from 'react'

import type { Office } from '@/content/types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const hasCoords = (o: Office) =>
  typeof o.lat === 'number' && typeof o.lng === 'number' && (o.lat !== 0 || o.lng !== 0)

/**
 * Mapbox GL map of the office locations. Loaded only in the browser (dynamic
 * import inside the effect) so it never runs during SSR. Falls back to plain
 * address cards when no token is configured or no office has coordinates.
 */
export function OfficeMap({ offices }: { offices: Office[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const pts = offices.filter(hasCoords)

  useEffect(() => {
    if (!TOKEN || !ref.current) return
    const points = offices.filter(hasCoords)
    if (points.length === 0) return

    let cancelled = false
    let map: import('mapbox-gl').Map | undefined

    ;(async () => {
      const mapboxgl = (await import('mapbox-gl')).default
      if (cancelled || !ref.current) return
      mapboxgl.accessToken = TOKEN
      map = new mapboxgl.Map({
        container: ref.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [points[0].lng!, points[0].lat!],
        zoom: 11,
        cooperativeGestures: true, // don't hijack page scroll (Lenis)
      })
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      const bounds = new mapboxgl.LngLatBounds()
      for (const o of points) {
        new mapboxgl.Marker({ color: '#DA2128' })
          .setLngLat([o.lng!, o.lat!])
          .setPopup(new mapboxgl.Popup({ offset: 22 }).setHTML(`<strong>${o.city}</strong><br/>${o.address}`))
          .addTo(map)
        bounds.extend([o.lng!, o.lat!])
      }
      if (points.length > 1) map.fitBounds(bounds, { padding: 90, maxZoom: 13, duration: 0 })
      else map.setCenter([points[0].lng!, points[0].lat!]).setZoom(13)
    })()

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [offices])

  // Graceful fallback: no token configured, or no office has coordinates yet.
  if (!TOKEN || pts.length === 0) {
    return (
      <div className="office-cards">
        {offices.map((o) => (
          <div className="office-card reveal" key={o.address}>
            <span className="map-city">{o.city}</span>
            <span className="map-region">{o.region}</span>
            <p className="office-address">{o.address}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="office-map-wrap reveal">
      <div ref={ref} className="office-map" aria-label="Map of JV Ventures offices" role="img" />
      <ul className="office-map-legend">
        {pts.map((o) => (
          <li key={o.address}>
            <span className="map-city">{o.city}</span>
            <span className="map-region">{o.region}</span>
            <span className="office-address">{o.address}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
