# ATOMZ Website Rebuild Specification

This is the central source of truth for the ATOMZ (atomz.online) website rebuild.

## Section 0: Hard Rules
- Plain HTML/CSS/JS only. No framework, bundler, or build step.
- Do NOT touch `horizon-preview.html` or any payment/checkout code in `/tools/`.
- Do NOT invent clients, testimonials, logos, numbers, ratings or results. Use the exact Work-card data below; use clearly-commented placeholders where it says so.
- Keep every existing URL working. Redirect `/tools.html` to `/` rather than deleting it.
- Keep CSS in `assets/css/atomz.css` and JS in the existing JS files (`assets/js/atomz.js`, `assets/js/theme.js`); don't scatter new inline styles/scripts.
- Mobile is the priority. Every phase must look right at 390px with no horizontal scroll and no overlapping elements.
- Respect `prefers-reduced-motion` for all animations.

## Tech Stack & Design Tokens
- External CSS: `assets/css/atomz.css`
- External JS: `assets/js/atomz.js` (deferred) and `assets/js/theme.js`
- Design Tokens (from `:root`):
  - Accent / Orange: `--accent: #FF4D2E`, `--accent-hover: #FF6644`, `--zen-orange: #FF713B`
  - Dark Theme: `--bg: #0A0B0D`, `--surface: #121418`, `--surface-hover: #1A1D24`, `--band-bg: #0F1014`
  - Light Theme: `--bg: #FFFFFF`, `--surface: #F5F4F0`, `--fg: #111215`
  - Text: `--fg: #F2F0EB`, `--fg-dim: #D1CEC7`, `--muted: #8A8880`, `--gold: #F5B041`
- Logo: `/assets/images/logo.png`
- Contacts:
  - WhatsApp Aryan: `https://wa.me/919099939034` (primary for CTAs)
  - WhatsApp Rajdeep: `https://wa.me/918108870798`
  - Instagram: `https://instagram.com/at261062` and `https://instagram.com/raj117m`

## Phase 1: Header & Navigation
- Exact 5 items in sticky header in one identical style (same font, size, padding, hover state) with no label clipping/overflow:
  1. ATOMZ logo + name (left) → `/`
  2. "Work" → `#work`
  3. "ATOM ZEN" → `atom-zen/`
  4. "Writing" → `/writing/`
  5. "Talk on WhatsApp" button (right) → `https://wa.me/919099939034` (one contrasting primary CTA)
- Remove `Services`, `Tools`, and `Contact` from nav completely.
- Move Horizon to a small, lower-weight "Client Portal" text link → `horizon-preview.html`, visibly less prominent than the 5 items.
- Theme toggle: Reposition so it never overlaps the ATOMZ wordmark on mobile, or keep cleanly integrated.
- Under 768px: collapse nav into hamburger / full-screen menu, tap targets >=48px, 8px spacing.
- Sticky bottom bar on mobile (<=768px) with a single "WhatsApp us" button → `https://wa.me/919099939034`.
- Rename existing "How we work" section id from `work` to `process` (freeing `#work` for the Work showcase).

## Phase 2: Hero + Proof Strip
- Headline: "WE MAKE GROWTH INEVITABLE."
- Supporting line: "We build the systems that bring businesses more customers — tools, content, and campaigns."
- Two buttons: Primary "Talk on WhatsApp" → `https://wa.me/919099939034`; Secondary "See our work" → `#work`.
- REMOVE the glowing orange dot entirely.
- Thin Proof Strip directly under hero: "What we do: Digital tools · Email automation · Footfall campaigns · Reels & content · Win-back calls"
- Scroll reveal using plain CSS + IntersectionObserver (.reveal / .in).

## Phase 3: Work Showcase (#work)
- Section id `work`, directly after the proof strip.
- Identical card format: Title → one line "what we built" → honest status chip (Live / In build / Pilot) → media slot (pure-CSS device frame or placeholder).
- Staggered scroll-reveal. No invented numbers.
- 7 Cards:
  1. SM Cafinity — "Café ordering system: customers order from an NFC/QR menu, staff get it on a live screen." — In build — link: `https://www.eazydiner.com/mumbai/sm-cafinity-hiranandani-estate-thane-region-715187`
  2. Lifeshots — "Offline footfall campaign: a system that turns local awareness into tracked clinic visits." — In build — link: `https://life-shots.com`
  3. Meats & Plants — "Staff tool: attendance, daily SOP checklists and revenue tracking." — In build — no link.
  4. Email automation — "Outreach system that sends and follows up automatically, with a review step before anything goes out." — Pilot — no link.
  5. Reels & content — "Short-form reels and posts for businesses." — Live — placeholder for reel thumbnails (`<!-- PLACEHOLDER: reel thumbnails Raj will add -->`).
  6. Win-back campaigns — "We call a business's past customers to bring them back." — Live — no link.
  7. Creator audits & scripts — "Custom audits for creators, plus scripts and reel help." — Live — no link.
  - After card 7: `<!-- PLACEHOLDER: more client cards when Raj supplies verified names/links -->`

## Phase 4: Home Body
- "What you get" (#services): icon row / bento grid of the 5 offerings (Digital tools, Email automation, Footfall campaigns, Reels & content, Win-back calls). ~20 words each. Keep id `#services`.
- "How we work" (#process): 3-step timeline: (1) "We study your business", (2) "We build the system", (3) "You get more customers and we track it." ~15 words each.
- ATOM ZEN home block: Explained block with heading "Build your package", line "Pick what you need and we'll put together a plan — in under two minutes", 3-step preview (Choose → Combine → Talk to us), and button "Open ATOM ZEN" → `atom-zen/`.
- `#elements` (A-T-O-M-Z): keep, add scroll-in animation.
- `.ticker` marquee: keep, pure-CSS keyframes.
- Final CTA: "Let's talk on WhatsApp." + button → `https://wa.me/919099939034`.
- Footer: logo, Client Portal link, Instagram (both handles), WhatsApp, Writing link (`/writing/`).
- REMOVE embedded `#writing` from `index.html`.

## Phase 5: Writing Page (/writing/)
- Create `/writing/index.html` with site header and footer.
- 2 Research papers:
  1. "CPG Retailer Deductions & Chargebacks" → `/blog/attention-is-not-a-business.html`
  2. "Software Opportunities in Agency Delivery" → `/blog/quality-creates-community.html`
- Point header "Writing" to `/writing/` on every page.

## Phase 6: ATOM ZEN Rebuild (/atom-zen/)
- 3 labelled steps with visible progress indicator (Step 1 of 3, etc.).
- Step 1 "Choose what you need": 5 tappable cards with icons (Digital tools, Email automation, Footfall campaigns, Reels & content, Win-back calls).
- Step 2 "Add detail": 2-3 short plain-language questions.
- Step 3 "Your plan": live summary + button "Send this to ATOMZ on WhatsApp" → `https://wa.me/919099939034?text=...` with pre-filled picks.
- Bug fixes: consistent naming ("ATOM ZEN"), remove duplicate "How it works", dead links, approval-vs-order contradiction, remove glowing orange dot.
- Working "Play explanation" explaining what ATOMZ delivers.

## Phase 7: SEO + Mobile QA
- `sitemap.xml`: clean, valid public URLs.
- Blog `<title>` and canonical tags updated to match actual titles.
- Organization JSON-LD on home page.
- Redirect `/tools.html` to `/`.
- Mobile QA at 360px, 390px, 430px.
- Lighthouse check.
