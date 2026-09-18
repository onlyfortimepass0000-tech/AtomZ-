# ATOMZ Order Desk

A standalone, no-AI custom-order tracker for Instagram sellers. Local preview, not deployed to atomz.online. No payment checkout or paid-access enforcement.

## Start

From the Growth agency project:

```sh
node atomz-order-desk/serve.mjs
```

Open http://127.0.0.1:4188. If the port is occupied, use `ORDER_DESK_PORT=4189 node atomz-order-desk/serve.mjs` and open that port.

You can also open `dist/index.html` directly in Chrome or use Your business → Download offline app. No installation or paid API is needed. For the hosted edition, serve the contents of `dist/` from a static directory. The preview server binds only to the local Mac and serves only the application, not other project files.

## Use

- Explore fictional samples, or choose Use my own orders for a blank workspace.
- Add an order; required fields are customer, product, price and delivery/pickup date.
- Open an order to update its stage or a payment you have verified.
- View quote → copy text, save a PNG, or print/save a PDF. Then manually mark the quote sent.
- Follow-ups show due enquiries, advances, balances and delivery issues. Copy the prepared message; Instagram and WhatsApp open only when you click their links. No messages are sent automatically.
- Your business saves your quote branding and booking terms.
- Export CSV for a spreadsheet. Download/restore JSON backups to preserve or move the complete workspace.

The app has no AI, third-party scripts, background processing, customer server, or connection to KROHA. Customer details stay in the browser unless you explicitly share/export them. Browser-data clearing removes orders; private browsing may not retain them. Different devices, browsers, domains and the downloaded app do not sync. Keep backups. Monetary amounts are INR; quotes are not tax invoices. Tax computation is outside this version.

## Research and price

See `PRODUCT-RESEARCH.md` for sources, competing options, the proposed ₹499 one-time offer, trial design, launch steps, and a small paid-demand test. The preview is fully unlocked so Raj can evaluate it. Public trial and paid-download packaging must be separated before accepting money.

## Verification

With the preview running, `node atomz-order-desk/check.mjs` uses the existing parent project's Playwright installation to test the local app. It uses an isolated browser session and fictional records. It does not touch the KROHA browser or real outreach records. Screenshots and test exports are written under `checks/`.
