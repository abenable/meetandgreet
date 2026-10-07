import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Vitest gets its own config: the app's vite.config.ts uses the Cloudflare
// plugin, whose worker environment is incompatible with vitest's SSR externals.
export default defineConfig({
  resolve: {
    alias: {
      '#': fileURLToPath(new URL('./src', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
    // Prisma's validation tests construct a client; give them room.
    testTimeout: 20_000,
  },
})
