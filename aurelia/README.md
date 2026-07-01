# ◆ Aurelia — Design, elevated

An elite, conversion-first website kit for premium brands and studios. Six crafted
pages that share one refined design system, with dark & light themes, tasteful
motion, and zero build step. Open it in a browser and it just works.

> **Vibe:** luxury brand · champagne gold · elegant serif · restrained.

---

## What's inside

| File | Purpose |
|------|---------|
| `index.html` | Landing page — hero, showcase, features, stats, testimonials, FAQ, CTA |
| `features.html` | Deep-dive on the kit's capabilities |
| `pricing.html` | Membership tiers with an animated monthly/annual toggle |
| `about.html` | Studio story, principles, and stats |
| `blog.html` | "Journal" — an essay/blog index layout |
| `contact.html` | Contact form + details (demo form, wire to your own endpoint) |
| `assets/styles.css` | The shared design system — every page inherits it |
| `assets/app.js` | Shared behaviour: theme toggle, nav, reveal, pricing toggle |

No frameworks. No npm. No bundler. Just HTML, one stylesheet, and a few KB of
vanilla JavaScript.

---

## Quick start

1. Open `index.html` in any modern browser, **or** serve the folder:
   ```bash
   cd aurelia
   python3 -m http.server 8080
   # then visit http://localhost:8080
   ```
2. Edit the text to make it yours.
3. Change a few tokens (below) to rebrand.
4. Deploy the folder to any static host (Netlify, Vercel, GitHub Pages, S3…).

---

## Rebrand in two minutes

Everything visual is controlled by CSS custom properties at the top of
`assets/styles.css`. Change these and the whole kit follows.

```css
:root {
  --gold:   #d8b26a;   /* your accent            */
  --gold-2: #b98f4c;   /* accent, darker         */
  --bg:     #0b0b0e;   /* page background (dark)  */
  --ink:    #f3efe9;   /* body text (dark)        */
  --serif:  "Fraunces", serif;   /* display font */
  --sans:   "Inter", sans-serif; /* body font    */
}
```

The light theme lives under `html.light { … }` in the same file — adjust those
tokens to tune light mode independently.

### Swap the fonts
Replace the Google Fonts `<link>` in each page's `<head>` and update `--serif`
/ `--sans`. That's it.

---

## Features

- **Six complete pages** sharing one coherent design language.
- **Dark & light themes** — hand-tuned, saved to `localStorage`, no flash on load.
- **Animated pricing toggle** — monthly/annual with a savings badge.
- **Scroll-reveal animations** via `IntersectionObserver` (respects
  `prefers-reduced-motion`).
- **Responsive** from phone to desktop, with a slide-down mobile menu.
- **Accessible foundations** — semantic landmarks, focus states, ARIA where it counts.
- **SEO-ready** — title, description, and Open Graph tags on every page.

---

## Customising behaviour

`assets/app.js` reads a few `data-` attributes, so markup stays declarative:

| Attribute | Effect |
|-----------|--------|
| `data-theme-toggle` | Element toggles dark/light on click |
| `data-menu-toggle` | Element opens/closes the mobile menu |
| `data-reveal` | Element fades/rises in when scrolled into view (`.d1`/`.d2`/`.d3` stagger) |
| `data-price-switch` | The monthly/annual switch |
| `data-m` + `data-a` | Price value shown for monthly vs. annual |
| `data-per` | Text after the price ("/month" vs "/mo · billed yearly") |
| `data-year` | Filled with the current year |

---

## Licence

Provided as a template for your own and client projects under your Aurelia
membership. Don't resell or redistribute the kit itself as a template.

---

*Crafted with care. Design, elevated.*
