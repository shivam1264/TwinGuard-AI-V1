// Playwright configuration for TwinGuard AI browser QA.
// Resolves @playwright/test from the global install (NODE_PATH set at runtime).
let defineConfig;
try {
  defineConfig = require('@playwright/test').defineConfig;
} catch (_) {
  defineConfig = require('/c/nvm4w/nodejs/node_modules/@playwright/test').defineConfig;
}

module.exports = defineConfig({
  testDir: './tests/playwright',
  output: './artifacts/playwright',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  webServer: {
    command: 'npm run dev',
    port: 5173,
    timeout: 240000,
    reuseExistingServer: true,
    env: { ...process.env },
  },
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 15000,
    navigationTimeout: 45000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      args: ['--disable-features=site-per-process'],
    },
  },
  projects: [
    {
      name: 'chromium-1920x1080',
      use: { browserName: 'chromium', viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'chromium-1366x768',
      use: { browserName: 'chromium', viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'chromium-1280x720',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 720 } },
    },
  ],
});
