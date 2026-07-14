import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: './test/setup.ts',
    // Run tests single-threaded to avoid SQLite file locking in local test DB
    threads: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      all: true,
      include: ['src/**/*.ts'],
      exclude: ['test/**', 'drizzle/**', 'node_modules/**'],
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  }
});
