import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  reporter: process.env.CI
    ? [['list'], ['junit', { outputFile: 'test-results/results.xml' }]]
    : [['list']],
  use: {
    baseURL: 'http://localhost:4321',
  },
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
