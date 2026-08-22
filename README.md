# ATOMZ — atomz.in

**We make growth inevitable.** — Build relentlessly. Compound consistently.

A fast, mobile-first marketing site for ATOMZ, a growth partner for creators
and founders. Static HTML/CSS/JS — no build step, no framework, no runtime
dependencies. Drop it on any static host.

## Run it

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Structure

```
index.html                          Home (hero, services, how-we-work, free month, writing, contact)
blog/                               Individual post pages
  attention-is-not-a-business.html
  quality-creates-community.html
  why-we-dont-sell-social-media-management.html
  build-relentlessly-compound-consistently.html
assets/css/atomz.css                All styling — token-driven
assets/js/atomz.js                  Theme, reveals, and the compounding rail (progressive enhancement)
favicon.svg  robots.txt  sitemap.xml
```

The site is fully readable with JavaScript disabled — `atomz.js` only adds
motion, the theme toggle, and the scroll-linked signature.

## The signature element — "The Compound"

Growth that visibly **accumulates as you scroll**. Discrete unit-blocks fill
from the base upward, and the increments grow *taller toward the top*, so the
mass accelerates — enacting *compound consistently*. Desktop shows a vertical
rail in the right margin (capped with a coral **Z**, for Zero Limits); mobile
shows a slim segmented bar at the top. It is abstract by design — no numbers,
no charts, nothing that could read as a claimed result.

## Design tokens & theming (hard requirement)

Every colour and spacing value is a CSS custom property in
`assets/css/atomz.css`. Components reference **semantic** tokens only
(`--bg`, `--fg`, `--surface`, `--band-bg`, `--accent`, `--hairline`, …) — there
are no hardcoded hex values in components.

**Flip the whole site to dark-dominant** by setting one attribute:

```html
<html data-theme="dark">
```

The theme toggle in the header does this at runtime and remembers the choice
(`localStorage`). To change the palette, edit only the base tokens in `:root`
(and their `[data-theme="dark"]` counterparts).

Locked palette: paper `#F5F5F0`, ink `#0B0B0D`, dark band `#17171A`, accent
`#FF4D2E`, gold `#F2B705` (used sparingly), warm grey for muted text.
*Note:* readable secondary text uses a slightly deeper warm grey than the
spec's `#8A8A8E` so body text clears WCAG AA (4.5:1); the literal `#8A8A8E`
is kept as `--muted-faint` for decorative use only. Primary CTAs use
ink-on-coral, which passes AA.

Typography: **Bricolage Grotesque** (display) + **Hanken Grotesk** (body),
loaded from Google Fonts with `display=swap` and system-font fallbacks.

## Removing the "Free First Month" block

It is a single self-contained section. Delete everything between these markers
in `index.html`:

```html
<!-- REMOVABLE BLOCK · Free First Month — ... -->
...
<!-- END REMOVABLE BLOCK · Free First Month -->
```

Nothing else references it.

## Contact links

WhatsApp-first. Update the numbers in the `wa.me/…` and `tel:…` links if they
change:

- Aryan Thakkar — Founder — `+91 90999 39034`
- Rajdeep Malladeb — Co-founder — `+91 81088 70798`

## Accessibility & performance

- Mobile-first, semantic HTML, single `<h1>` per page, sensible heading order.
- Visible `:focus-visible` rings that stay high-contrast on light and dark bands.
- Body text meets WCAG AA contrast; motion respects `prefers-reduced-motion`.
- No blocking scripts (`defer`), no heavy libraries, fonts preconnected.
