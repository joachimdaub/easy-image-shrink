import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
after(async () => browser.close());
const source = await readFile(new URL('../assets/app.js', import.meta.url), 'utf8');
const injected = source.replace('  function loadImage(file) {', '  window.__testPrepareSvg = prepareSvg;\n  function loadImage(file) {');
assert.notEqual(injected, source, 'could not inject test hook');
const baseHtml = `<!doctype html><html><body>
<input id="width" value="1920"><select id="quality"><option value="medium">medium</option></select>
<select id="format"><option value="original">original</option></select>
<div id="dropzone"></div><input id="files" type="file">
<div id="status"></div><div id="results"></div></body></html>`;

async function sanitize(svg) {
  const page = await browser.newPage();
  try {
    await page.setContent(baseHtml);
    await page.addScriptTag({ content: injected });
    return await page.evaluate(async input => {
      const file = new File([input], 'test.svg', { type: 'image/svg+xml' });
      try { return { text: await (await window.__testPrepareSvg(file)).text() }; }
      catch (e) { return { error: String(e.message) }; }
    }, svg);
  } finally { await page.close(); }
}
const wrap = x => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${x}</svg>`;

test('safe basic geometry survives', async () => {
  const r = await sanitize(wrap('<rect width="10" height="20" fill="red"/>'));
  assert.match(r.text, /<rect/);
  assert.match(r.text, /fill="red"/);
});

test('scripts and event handlers never survive', async () => {
  const r = await sanitize(wrap('<script>alert(1)</script><rect onload="alert(1)" width="20"/>'));
  assert.doesNotMatch(r.text, /<script|onload|alert/i);
});

test('foreignObject, image and linked resources are removed', async () => {
  const r = await sanitize(wrap('<foreignObject><body xmlns="http://www.w3.org/1999/xhtml">X</body></foreignObject><image href="https://example.com/x.png"/><rect fill="url(https://example.com/x)"/>'));
  assert.doesNotMatch(r.text, /foreignObject|<image|https:|url\(/i);
});

test('unknown SVG tags and dangerous attributes are dropped', async () => {
  const r = await sanitize(wrap('<filter id="x"/><rect onclick="alert(1)" style="background:url(https://evil.example)" width="40"/>'));
  assert.doesNotMatch(r.text, /filter|onclick|style|evil/i);
  assert.match(r.text, /width="40"/);
});

test('DOCTYPE and entity declarations are rejected', async () => {
  const r = await sanitize('<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]>' + wrap('<text>&x;</text>'));
  assert.match(r.error, /Unsichere SVG-Deklaration/);
});

test('invalid SVG is rejected', async () => {
  const r = await sanitize('<svg><rect></svg>');
  assert.match(r.error, /Ungültige SVG-Datei/);
});

test('too deeply nested SVG is rejected', async () => {
  const r = await sanitize(wrap('<g>'.repeat(50) + '<rect/>' + '</g>'.repeat(50)));
  assert.match(r.error, /Zu komplexe SVG-Datei/);
});

test('linked use and references are rejected', async () => {
  const r = await sanitize(wrap('<use href="#shape"/><rect fill="url(#shape)" width="20"/>'));
  assert.doesNotMatch(r.text, /<use|url\(|href/);
});
