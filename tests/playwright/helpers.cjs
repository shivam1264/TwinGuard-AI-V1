// Shared helpers for TwinGuard AI browser QA tests.
// Real application services only - no mocks, no stubs.
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const SCREEN_DIR = path.resolve('artifacts/playwright/screenshots');
fs.mkdirSync(SCREEN_DIR, { recursive: true });

async function snap(page, name) {
  const info = test.info();
  const proj = info.project ? info.project.name : 'default';
  const safe = `${proj}_${name}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filePath = path.join(SCREEN_DIR, `${safe}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  await info.attach(`screenshot: ${name} (${proj})`, {
    path: filePath,
    contentType: 'image/png',
  });
  return filePath;
}

function startErrorCollection(page) {
  const collected = {
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    failedRequests: [],
    errorResponses: [],
  };

  page.on('console', (msg) => {
    const entry = { text: msg.text(), type: msg.type(), location: msg.location() };
    if (msg.type() === 'error') collected.consoleErrors.push(entry);
    else if (msg.type() === 'warning') collected.consoleWarnings.push(entry);
  });

  page.on('pageerror', (err) => {
    collected.pageErrors.push({ message: err.message, stack: err.stack });
  });

  page.on('requestfailed', (req) => {
    collected.failedRequests.push({ url: req.url(), failure: req.failure() });
  });

  page.on('response', (res) => {
    if (res.status() >= 400) {
      collected.errorResponses.push({ url: res.url(), status: res.status() });
    }
  });

  return collected;
}

async function attachErrors(info, collected) {
  const hasAny =
    collected.consoleErrors.length ||
    collected.pageErrors.length ||
    collected.failedRequests.length ||
    collected.errorResponses.length;
  if (!hasAny) return;
  const lines = [];
  if (collected.consoleErrors.length) {
    lines.push('CONSOLE ERRORS:');
    collected.consoleErrors.forEach((e) => lines.push(`  [${e.type}] ${e.text}`));
  }
  if (collected.consoleWarnings.length) {
    lines.push('CONSOLE WARNINGS:');
    collected.consoleWarnings.slice(0, 40).forEach((e) => lines.push(`  [${e.type}] ${e.text}`));
  }
  if (collected.pageErrors.length) {
    lines.push('PAGE ERRORS:');
    collected.pageErrors.forEach((e) => lines.push(`  ${e.message}`));
  }
  if (collected.failedRequests.length) {
    lines.push('FAILED REQUESTS:');
    collected.failedRequests.forEach((e) => lines.push(`  ${e.url} ${JSON.stringify(e.failure)}`));
  }
  if (collected.errorResponses.length) {
    lines.push('ERROR RESPONSES:');
    collected.errorResponses.forEach((e) => lines.push(`  ${e.status} ${e.url}`));
  }
  await info.attach('browser errors & network', {
    body: lines.join('\n'),
    contentType: 'text/plain',
  });
}

async function waitForApp(page) {
  await expect(page.getByText('TWINGUARD AI')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30000 });
  await page.waitForTimeout(1500);
}

async function getSceneManager(page) {
  return page.evaluate(() => window.__sceneManager);
}

async function getBackendState(page) {
  const res = await page.request.fetch('http://localhost:5000/api/state');
  return res.json();
}

function floorButtonOverlay(page, floorNum) {
  return page.locator(`text=L${floorNum}`).last();
}

module.exports = { snap, startErrorCollection, attachErrors, waitForApp, getSceneManager, getBackendState, floorButtonOverlay, SCREEN_DIR };
