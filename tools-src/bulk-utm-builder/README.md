# Bulk UTM Builder

Standalone, 100% client-side web tool to convert bulk destination URLs into correctly tagged, URL-encoded campaign tracking links with channel presets, duplicate detection, CSV/TXT export, and browser local storage preset saving.

## Local Dev
```bash
npm install
npm run dev
```

## Unit Tests
```bash
npm test
```

## Build & Deploy
```bash
npm run build
```
Build outputs static HTML, JS, CSS to `atomz.online/tools/bulk-utm-builder/`.

## Deploy as Static Website
Host the `tools/bulk-utm-builder/` directory on any static web host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, Nginx, Apache, S3).
No backend or database required.
