import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Unit tests run in plain Node (no Next runtime). `server-only` would throw when
// imported outside an RSC server, so we alias it to a noop stub; `@/` mirrors the
// app's path alias. AUTH_SECRET is provided so src/lib/auth.ts boots under test.
export default defineConfig({
  resolve: {
    alias: {
      'server-only': fileURLToPath(new URL('./src/test/server-only-stub.ts', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: { AUTH_SECRET: 'test-secret-key-for-unit-tests-only' },
  },
})
