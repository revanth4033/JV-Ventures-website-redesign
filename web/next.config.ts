import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: '/assets/**' }, // seeded prototype assets
      { pathname: '/uploads/**' }, // admin uploads (local dev)
      { pathname: '/favicon.png' },
    ],
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }, // Vercel Blob media
      { protocol: 'https', hostname: 'cdn.sanity.io' }, // Sanity image CDN
    ],
  },
  // Security response headers. CSP keeps script-src permissive enough for Next's
  // inline runtime, GSAP, and the embedded Sanity Studio (eval), while locking down
  // object/base/frame-ancestors and restricting img/media/connect origins. The
  // stored-XSS vector is additionally closed by server-side sanitisation.
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://cdn.sanity.io",
      "media-src 'self' https://*.public.blob.vercel-storage.com https://cdn.sanity.io",
      "font-src 'self' data:",
      "connect-src 'self' https://*.sanity.io wss://*.sanity.io https://*.public.blob.vercel-storage.com",
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
