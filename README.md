# Baden Morgan — Online CV

Public résumé site with layered print/PDF deterrents. LaTeX/PDF source remains in `outputs/`.

Live: <https://badenmorgan.github.io/cv/>

## Structure

```
index.html
.nojekyll
.github/workflows/deploy.yml   GitHub Actions → Pages
assets/css/resume.css
assets/css/print.css
assets/data/resume.json        content (keep in sync with outputs/resume.tex)
assets/js/main.js
assets/js/render.js
assets/js/print-guard.js
assets/js/virtual-scroll.js
assets/img/profile.jpg
assets/text-images/            optional pre-baked PNGs (see below)
scripts/generate-text-images.mjs
```

No CI build — static files only.

## Deployment

Same pattern as [dachshund-feeding-tool](https://github.com/BadenMorgan/dachshund-feeding-tool):

1. One-time: **Settings → Pages → Source: GitHub Actions**
2. Every push to `main` runs `.github/workflows/deploy.yml` (uploads repo root)

## Content sync

Edit `assets/data/resume.json` when the résumé changes. `outputs/resume.tex` is the printable/PDF source and is separate.

## Optional text-image bake

Sensitive body copy is shown as CSS `background-image` (browser canvas at runtime, or committed PNGs). To bake PNGs:

```bash
npm install
npm run generate:text-images
```

Commit files under `assets/text-images/`. If PNGs are missing, the page still draws them in the browser.

## Print defenses (limits)

Layers: print CSS notice, DOM swap on `beforeprint` / `matchMedia('print')`, sensitive text as background images, viewport virtualization.

These deter casual Print → PDF in Chrome/Firefox. They do **not** stop cloning the repo, `curl`, view-source, DevTools, headless browsers, or Firefox Reader Mode.

## Verify after deploy

Open the live URL and paste back:

```
live: loads / 404 / broken
console errors: none / …
print: notice-only / full CV / mixed
emulate: swapped / not swapped
scroll: ok / jumpy / blank
actions: pass / fail (<link>)
```
