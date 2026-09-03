# A&S Tech (astech) - Client Landing Page

Vanilla HTML/CSS/JS marketing site for A&S Tech: business websites, e-commerce and AI chat solutions. No build step, deploys straight to Firebase Hosting.

## Features

- Responsive sticky nav: hamburger menu on mobile, smooth scroll, active-link highlighting (IntersectionObserver), back-to-top button
- Services grid: 6 client services with detail modals (Esc/backdrop close, focus restore), CTA to contact
- Pricing: 3 tiers with monthly/yearly toggle persisted in localStorage
- Social proof: testimonials carousel (autoplay 6s, prev/next, dots, pauses on hover/focus, arrow keys)
- FAQ accordion with aria-expanded
- Contact + lead capture: validated form (inline errors, success state, leads in localStorage, mailto fallback), newsletter signup, opening hours/location block
- Theme + motion: dark/light toggle persisted, scroll-reveal animations, lazy-loaded images, prefers-reduced-motion respected
- SEO + hosting polish: title/description/OG/Twitter/canonical/favicon, sitemap.xml, robots.txt, branded 404, skip link, focus styles, semantic landmarks

## Screenshots

Placeholders (drop files in `public/images/` and link them here):

- `docs/screenshots/hero.png` - hero + sticky nav
- `docs/screenshots/services.png` - services grid + modal
- `docs/screenshots/pricing.png` - pricing toggle
- `docs/screenshots/testimonials.png` - carousel + FAQ
- `docs/screenshots/contact.png` - contact form + hours
- `docs/screenshots/light-mode.png` - light theme

## Structure

```
astech/
  firebase.json        # hosting config (public/ dir)
  public/
    index.html         # landing page
    tech.html          # stack page
    styles.css         # all styles (no build)
    app.js             # all interactions (vanilla, node --check clean)
    404.html           # branded not-found page
    sitemap.xml        # sitemap
    robots.txt         # robots
    images/            # logos, illustrations
```

## Local preview

No install needed. From the project root:

```bash
npx serve public
# or
python3 -m http.server --directory public 8000
# or (with Firebase CLI)
firebase serve
```

Then open http://localhost:3000 (serve) or http://localhost:8000 (python) or http://localhost:5000 (firebase).

Sanity check:

```bash
node --check public/app.js
python3 -c "from html.parser import HTMLParser; p=HTMLParser(); p.feed(open('public/index.html').read()); print('HTML OK')"
```

## Deploy

```bash
firebase login
firebase deploy
```

`firebase.json` serves `public/` as the web root. No build step, no secrets in the repo.

## Roadmap

- Real form backend (replace localStorage leads with Formspree/Firebase Function)
- Real contact email + phone/WhatsApp number
- Custom domain + canonical/OG URL update
- Docs screenshots (see placeholders above)
- Lighthouse pass: font preconnect, image compression, alt-text audit
- Blog/case-study pages reusing the same theme
