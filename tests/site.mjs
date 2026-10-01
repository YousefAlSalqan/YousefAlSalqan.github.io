import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = new URL('../', import.meta.url);
const output = new URL('../test-results/', import.meta.url);
const base = 'http://127.0.0.1:4174';
const server = spawn('python', ['-m', 'http.server', '4174', '--bind', '127.0.0.1'], {
  cwd: root, windowsHide: true, stdio: 'ignore',
});
let serverError;
server.on('error', error => { serverError = error; });
let browser;

function luminance(hex) {
  const rgb = hex.match(/[a-f\d]{2}/gi).map(channel => parseInt(channel, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}

try {
  await mkdir(output, { recursive: true });
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (serverError) throw serverError;
    assert.equal(server.exitCode, null, 'Local test server exited');
    try { ready = (await fetch(base)).ok; } catch { /* Server is starting. */ }
    if (ready) break;
    await delay(100);
  }
  assert(ready, 'Local test server did not start');
  browser = await chromium.launch();
  const errors = [];

  for (const [width, height] of [[320, 740], [390, 844], [768, 1024], [1024, 900], [1440, 1000]]) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height }, colorScheme: theme, reducedMotion: 'reduce' });
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
      await page.goto(base);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
      assert.equal(await page.locator('h1').textContent(), 'I build for the real world.');
      assert.equal(await page.locator('.other-projects article').count(), 4);
      assert.equal(await page.locator('.journey-gallery img').count(), 3);
      for (const link of await page.locator('.journey-gallery a').all()) {
        assert.equal(await link.getAttribute('href'), await link.locator('img').getAttribute('src'));
      }
      assert.equal(await page.locator('.jobs article').count(), 5);
      assert.equal(await page.locator('a[href="https://github.com/YousefAlSalqan/WealthGuide"]').count(), 1);
      const body = await page.locator('body').innerText();
      assert(!/[\u2013\u2014]/u.test(body), 'Visible copy contains a long dash');
      for (const anchor of await page.locator('a[href^="#"]').evaluateAll(nodes => nodes.map(node => node.hash))) {
        assert.equal(await page.locator(anchor).count(), 1, `Missing anchor ${anchor}`);
      }
      const hero = await page.locator('h1').evaluate(node => ({ height: node.offsetHeight, line: parseFloat(getComputedStyle(node).lineHeight) }));
      if (width >= 1024) assert(hero.height / hero.line < 2.1, 'Desktop heading exceeds two lines');
      const action = await page.locator('.hero .primary').boundingBox();
      assert(action.y + action.height < height, 'Hero action below the first viewport');

      const colors = await page.evaluate(() => Object.fromEntries(
        ['page', 'surface', 'paper', 'text', 'muted', 'control', 'accent', 'on-accent', 'accent-soft']
          .map(name => [name, getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()])
      ));
      for (const background of ['page', 'surface', 'paper', 'accent-soft']) {
        for (const foreground of ['text', 'muted', 'accent']) {
          assert(contrast(colors[foreground], colors[background]) >= 4.5, `${theme}: ${foreground}/${background} contrast`);
        }
      }
      assert(contrast(colors['on-accent'], colors.accent) >= 4.5, 'Primary button text contrast');
      assert(contrast(colors.control, colors.page) >= 3, 'Control border contrast');

      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').textContent(), 'Skip to content');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator(':focus').getAttribute('id'), 'main');
      await page.locator('summary').focus();
      await page.keyboard.press('Enter');
      assert(await page.locator('details').evaluate(node => node.open), 'Keyboard cannot open the case study');
      for (const image of await page.locator('img').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(node => node.decode());
        assert(await image.evaluate(node => node.naturalWidth > 0 && !!node.alt), 'Broken image or missing alt');
        if (await image.evaluate(node => !!node.closest('.journey-gallery, .project-image'))) {
          assert(await image.evaluate(node => Math.abs(node.width / node.height - node.naturalWidth / node.naturalHeight) < .02), 'Screenshot is cropped or stretched');
        }
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth) <= width, `${width}px horizontal overflow`);
      await page.locator('summary').click();
      await page.evaluate(() => scrollTo(0, 0));
      if (width === 390 || width === 1440) await page.screenshot({ path: fileURLToPath(new URL(`${width}-${theme}.png`, output)), fullPage: true });
      await page.locator('#theme').selectOption(theme === 'light' ? 'dark' : 'light');
      assert.notEqual(await page.locator('html').getAttribute('data-theme'), theme, 'Manual theme toggle failed');
      await page.locator('#theme').selectOption('system');
      await page.emulateMedia({ colorScheme: theme === 'light' ? 'dark' : 'light' });
      await page.waitForFunction(previous => document.documentElement.dataset.theme !== previous, theme);
      assert.notEqual(await page.locator('html').getAttribute('data-theme'), theme, 'System theme update failed');
      await page.close();
      console.log(`PASS ${width}px ${theme}: content, links, layout, contrast, keyboard, images, theme`);
    }
  }

  const motion = await browser.newPage({ reducedMotion: 'no-preference' });
  await motion.goto(base);
  assert(await motion.locator('.waiting').count() > 0, 'Motion setup was not exercised');
  await motion.emulateMedia({ reducedMotion: 'reduce' });
  await motion.waitForFunction(() => !document.querySelector('.waiting'));
  assert.equal(await motion.locator('.hero-copy').evaluate(node => getComputedStyle(node).animationName), 'none');
  await motion.close();
  const noScript = await browser.newPage({ javaScriptEnabled: false, colorScheme: 'dark' });
  await noScript.goto(base);
  assert.equal(await noScript.locator('html').evaluate(node => getComputedStyle(node).colorScheme), 'dark');
  assert.equal(await noScript.locator('.featured-project').evaluate(node => getComputedStyle(node).opacity), '1');
  assert(await noScript.locator('.theme-control').isHidden());
  await noScript.locator('summary').click();
  assert(await noScript.locator('details').evaluate(node => node.open));
  await noScript.close();
  assert.deepEqual(errors, [], 'Browser or resource errors');
  console.log('PASS reduced motion, no-JavaScript fallback, and browser errors');
} finally {
  await browser?.close();
  server.kill();
}
