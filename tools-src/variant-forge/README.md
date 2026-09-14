# VariantForge — Product Variant & SKU Generator

VariantForge is a 100% browser-based static web tool designed for small D2C ecommerce brands (clothing, footwear, accessories, cosmetics) to generate product variant combinations, SKUs with smart abbreviations, internal barcodes, printable product label PDFs, and Shopify/CSV/XLSX exports.

## Features
- **100% Client-Side Privacy**: No backend, no database, no cloud APIs, no authentication.
- **Cartesian Variant Generator**: Generates all valid option combinations (3 colors x 4 sizes = 12 variants) with live variant counter & large set warning (>1000 variants).
- **Smart SKU Engine**: Configurable separators (`-`, `_`, `none`), casing (`UPPERCASE`, `lowercase`), built-in abbreviations dictionary (`Black` -> `BLK`, `Extra Large` -> `XL`), and automatic abbreviation conflict detection (e.g. `Light Blue` vs `Light Brown`).
- **Validation Engine**: Real-time checking for duplicate SKUs, duplicate combinations, blank option values, invalid price/inventory numbers, and duplicate barcodes. Flags rows as `READY` or `NEEDS FIX`.
- **Interactive Variant Table & Bulk Edits**: Search, pagination (25 items/page), filter tabs, inline cell edits, and bulk actions ("Set all prices", "Set inventory", "Add ₹100 to XL sizes").
- **Internal Barcodes & Label Generator**: Code 128 barcodes via `jsbarcode` with disclaimer, customizable print label layouts (50x25mm, 50x30mm, 40x25mm, custom), live preview, browser printing, and PDF export (`jspdf`).
- **CSV/XLSX Import & Missing Variants**: Upload existing product tables using SheetJS (`xlsx`) to detect missing variant combinations without duplicating existing variants.
- **Export Formats**: Generic CSV, Excel XLSX, and Shopify-formatted CSV (`Handle`, `Title`, `Option1 Name`, `Option1 Value`, `Option2 Name`, `Option2 Value`, `Option3 Name`, `Option3 Value`, `Variant SKU`, `Variant Price`, `Variant Compare At Price`, `Variant Inventory Qty`, `Variant Barcode`) with sanitized filenames.

---

## Local Development

```bash
cd tools-src/variant-forge
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

Build output is written directly to `tools/variant-forge/index.html`.
