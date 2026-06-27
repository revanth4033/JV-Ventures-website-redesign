import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone + server.js) so the
  // Dockerfile's `COPY .next/standalone` / `node server.js` actually have something
  // to run. Vercel ignores this; it only matters for the Docker/self-host path.
  output: 'standalone',
  images: {
    // No image optimization: every image/video is served at its original quality
    // (no resizing, no recompression, no format change). next/image acts as a
    // straight pass-through so the frontend shows the exact source asset clarity.
    unoptimized: true,
    localPatterns: [
      { pathname: '/assets/**' }, // seeded prototype assets
      { pathname: '/uploads/**' }, // admin uploads (local dev)
      { pathname: '/favicon.png' },
    ],
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }, // Vercel Blob media
    ],
  },
  // Security response headers. CSP keeps script-src permissive enough for Next's
  // inline runtime and GSAP, while locking down object/base/frame-ancestors and
  // restricting img/media/connect origins. The stored-XSS vector is additionally
  // closed by server-side sanitisation.
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://api.mapbox.com https://*.tiles.mapbox.com",
      "media-src 'self' https://*.public.blob.vercel-storage.com",
      "font-src 'self' data:",
      // Mapbox GL fetches styles/tiles from api.mapbox.com and posts telemetry to events.mapbox.com.
      "connect-src 'self' https://*.public.blob.vercel-storage.com https://api.mapbox.com https://events.mapbox.com",
      "worker-src 'self' blob:", // Mapbox GL runs its renderer in a blob web worker
      "child-src blob:",
      "frame-src 'self' https://www.google.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
    ].join('; ')
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  // Redirect the old prototype URLs to the new routes (preserve inbound links).
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/about.html', destination: '/about', permanent: true },
      {
        source: '/platform.html',
        has: [{ type: 'query', key: 'p', value: '(?<p>[^&]+)' }],
        destination: '/platform/:p',
        permanent: true,
      },
      { source: '/platform.html', destination: '/platform', permanent: true },
    ]
  },
}

export default nextConfig
