// Structural assertions for public/index.html.
// These read the HTML and CSS as text and check that the page keeps its contract
// (expected section ids, accessible names, no obvious regressions). We deliberately
// avoid pulling in a parser package because the spec says no new dependencies.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const html = readFileSync(join(ROOT, 'public/index.html'), 'utf8');
const css = readFileSync(join(ROOT, 'public/styles.css'), 'utf8');

function sectionIds() {
  const re = /<section\s[^>]*id="([^"]+)"/g;
  const ids = [];
  let m;
  while ((m = re.exec(html)) !== null) ids.push(m[1]);
  return ids;
}

test('public/index.html has all expected section ids', () => {
  const expected = [
    'services', 'pricing', 'testimonials', 'faq', 'contact',
    'case-studies', 'process', 'team', 'careers', 'blog',
    'estimator', 'booking', 'clients', 'stats', 'work', 'compare',
    'support', 'status', 'changelog', 'docs-faq', 'proposal',
    'sitemap', 'share'
  ];
  const actual = sectionIds();
  for (const id of expected) {
    assert.ok(actual.includes(id), `missing section id "${id}" in index.html; got: ${actual.join(',')}`);
  }
});

test('hero contains the "CREATIVITY & INNOVATION" h1', () => {
  assert.match(html, /<h1>\s*CREATIVITY\s*&\s*INNOVATION\s*<\/h1>/);
});

test('hero h2 "TECHNOLOGY" is inside main', () => {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  assert.ok(main, 'no <main> element found');
  assert.match(main[1], /<h2>TECHNOLOGY<\/h2>/);
});

test('services heading "Services built for clients" is the first h2 inside #services', () => {
  const sec = html.match(/<section[^>]*id="services"[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(sec, 'no #services section');
  const h2 = sec[1].match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  assert.ok(h2, '#services has no h2');
  assert.equal(h2[1].trim(), 'Services built for clients');
});

test('all images in markup have an alt attribute (or aria-hidden)', () => {
  const imgs = Array.from(html.matchAll(/<img\b([^>]*)>/g));
  assert.ok(imgs.length > 0, 'no images found');
  for (const m of imgs) {
    const attrs = m[1];
    const hasAlt = /\salt="[^"]+"/.test(attrs);
    const ariaHidden = /\saria-hidden="true"/.test(attrs);
    assert.ok(hasAlt || ariaHidden, `<img> missing alt and not aria-hidden: ${m[0].slice(0, 120)}`);
  }
});

test('all top-level <button> elements with visible labels have an accessible name', () => {
  const buttons = Array.from(html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g));
  assert.ok(buttons.length > 0, 'no buttons');
  for (const m of buttons) {
    const attrs = m[1];
    const inner = m[2];
    const hasAriaLabel = /\saria-label="[^"]+"/.test(attrs);
    const hasAriaLabelledBy = /\saria-labelledby="[^"]+"/.test(attrs);
    const text = inner.replace(/<[^>]+>/g, '').trim();
    assert.ok(
      hasAriaLabel || hasAriaLabelledBy || text.length > 0,
      `<button> missing accessible name: ${m[0].slice(0, 120)}`
    );
  }
});

test('logo images declare explicit width and height (CLS)', () => {
  const logos = Array.from(html.matchAll(/<img\b([^>]*src="images\/[^"]+"[^>]*)>/g));
  assert.ok(logos.length > 0, 'no logo images found');
  for (const m of logos) {
    const attrs = m[1];
    assert.ok(/\swidth="\d+"/.test(attrs), `image missing width: ${m[0].slice(0, 120)}`);
    assert.ok(/\sheight="\d+"/.test(attrs), `image missing height: ${m[0].slice(0, 120)}`);
  }
});

test('canonical link points to a single absolute https URL', () => {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
  assert.ok(m, 'no canonical link');
  assert.match(m[1], /^https:\/\//);
});

test('public/app.js is loaded with defer (non-blocking)', () => {
  assert.match(html, /<script\s+src="app\.js"\s+defer\s*><\/script>/);
});

test('skip-link is the first focusable element in <body>', () => {
  const body = html.match(/<body>([\s\S]*?)<\/body>/);
  assert.ok(body, 'no <body>');
  const inner = body[1];
  // Anything before the skip-link must be aria-hidden (decorative, not focusable).
  const skipPos = inner.indexOf('<a class="skip-link"');
  assert.ok(skipPos > 0, 'skip-link not found in body');
  const before = inner.slice(0, skipPos);
  // Allow whitespace and tags that are explicitly aria-hidden (e.g., progress bar).
  const stripped = before.replace(/<[^>]+>/g, '').replace(/\s/g, '');
  assert.equal(stripped.length, 0, `unexpected content before skip-link: ${before}`);
  const tags = before.match(/<([a-zA-Z0-9]+)\b([^>]*)>/g) || [];
  for (const t of tags) {
    assert.match(t, /aria-hidden="true"/, `non-aria-hidden tag before skip-link: ${t}`);
  }
});

// CSS regression assertions

test('.services section no longer has a fixed height: 100vh (was causing giant void)', () => {
  // The old rule forced .services to be exactly 100vh, leaving a huge empty area
  // when content is shorter than the viewport.
  assert.doesNotMatch(css, /\.services\s*\{[^}]*height:\s*100vh/m);
});

test('.services h2 is not position: absolute (was escaping unpositioned parent)', () => {
  assert.doesNotMatch(css, /\.services\s+h2\s*\{[^}]*position:\s*absolute/m);
  assert.doesNotMatch(css, /\.services\s*h2\s*\{[^}]*position:\s*absolute/m);
});

test('footer has no negative z-index', () => {
  // Negative z-index on the footer would push it behind other content.
  assert.doesNotMatch(css, /\.footer__container\s*\{[^}]*z-index:\s*-\d+/m);
});

test('.button no longer has height: 100% globally (was stretching Send enquiry to 687px)', () => {
  assert.doesNotMatch(css, /\.button\s*\{[^}]*height:\s*100%/m);
});

test('html and body do not allow horizontal overflow', () => {
  assert.match(css, /html\s*\{[\s\S]*?overflow-x:\s*hidden/m, 'html overflow-x not hidden');
  assert.match(css, /body\s*\{[\s\S]*?overflow-x:\s*hidden/m, 'body overflow-x not hidden');
});

test('anchor-link targets have scroll-margin-top so they clear the sticky navbar', () => {
  // We accept either a plain `section { scroll-margin-top: ... }` rule or
  // a more specific selector like `section[id], main[id]`.
  const hasGlobal = /section\s*\{[\s\S]*?scroll-margin-top:\s*\d+px/m.test(css);
  const hasIdSelector = /section\[id\][\s\S]*?scroll-margin-top:\s*\d+px/m.test(css);
  const hasCombined = /section\[id\]\s*,\s*main\[id\][\s\S]*?scroll-margin-top:\s*\d+px/m.test(css);
  assert.ok(
    hasGlobal || hasIdSelector || hasCombined,
    'no scroll-margin-top declared for section anchors'
  );
});

test('marquee parent clips its overflowing track', () => {
  assert.match(css, /\.marquee\s*\{[^}]*overflow:\s*hidden/m);
});
