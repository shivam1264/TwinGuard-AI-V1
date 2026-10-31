import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=default']
    }
  }
});

