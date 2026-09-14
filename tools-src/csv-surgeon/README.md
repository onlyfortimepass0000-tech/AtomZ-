# CSV Surgeon — Ecommerce Catalog CSV Repair Engine

CSV Surgeon is a 100% browser-based static web tool that repairs broken ecommerce catalog CSV/XLSX spreadsheets failing Shopify, Meta Catalog, or Google Merchant imports.

## Key Features
- **100% Client-Side Privacy**: No backend, no cloud upload, no AI APIs, no database, no authentication.
- **The Wow Scan**: Animated real-time scanning sequence diagnosing product IDs, handles, prices, stock values, URLs, and required fields.
- **Deterministic Repair Engine**: Automatically repairs whitespace, removes currency symbols (`$`, `₹`, `Rs`, `INR`), normalizes availability wording (`YES` -> `in_stock`), encodes URL spaces, infers missing `https://` protocols, strips unallowed HTML tags, and maps header aliases (`Colour` -> `Color`, `Product Name` -> `Title`).
- **Smart Pattern Grouping**: Groups identical issues across hundreds of rows (e.g. "327 availability values use 'YES'") into 1 pattern card with a 1-click "Fix all 327" button and preview.
- **Card-by-Card Human Review**: For issues requiring human choices (missing images, duplicate SKU choices), presents simple card forms instead of a giant spreadsheet grid.
- **Before / After Diff Viewer**: Interactive side-by-side cell diff inspector.
- **Exports**: Download Fixed File (CSV / XLSX) + downloadable CSV Repair Report listing every row, field, original value, repaired value, and repair type.

---

## Local Development

```bash
cd tools-src/csv-surgeon
npm install
npm run dev
```

## Running Unit Tests

```bash
npm test
```

## Building Static Production Bundle

```bash
npm run build
```

Build output is generated directly into `tools/csv-surgeon/index.html`.
