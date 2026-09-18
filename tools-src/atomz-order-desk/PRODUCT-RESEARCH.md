# ATOMZ Order Desk — product and selling plan

Research checked 16 September 2026. This is a product hypothesis with a working local prototype, not proof of demand or sales.

## Recommendation

Start with independent Indian home bakers who sell custom orders through Instagram and WhatsApp. Then test gift-hamper makers. Sell a simple order desk: customer details, a branded quote, the required advance, payments received, delivery dates, and a list of people to follow up with.

The promise: **Know what you promised, what is paid, and who needs a reply.**

Instagram is the place to find the buyer. The product itself needs no Instagram access, AI, messaging API, or customer-data server. Orders and payment updates are entered by the seller. This limitation must be clear before purchase.

## What the evidence supports

- A baker in [r/smallbusiness](https://www.reddit.com/r/smallbusiness/comments/1u6f1a0/small_home_baking_business_order_management/) describes using Instagram messages, phone notes and a paper diary for orders. This is direct qualitative evidence of fragmented tracking, not a market-size estimate.
- An [IndianBakers discussion](https://www.reddit.com/r/IndianBakers/comments/1qzb228/how_are_you_managing_orders_customers_and/) mentions upcoming orders, advances, balances, and scattered order details. Treat it as an additional anecdote; forum posts and replies can include promotion and are not independently verified buyers.
- [Bakesy](https://www.bakesy.app/pricing) offers paid order-management plans listed at $9.99 and $17.99 per month. This demonstrates an established paid category, not that Indian sellers will pay ATOMZ. Its website, payment and cloud features are substantially broader than this local tool.
- [Bakesy's payment documentation](https://www.bakesy.app/post/accepting-payments) explicitly distinguishes automatic updates for its payment service from manually recording payments received elsewhere. Our prototype records verified payments manually.
- [Zoho Invoice](https://www.zoho.com/invoice/pricing/) already offers free invoicing. An invoice generator alone is a weak paid proposition. The order-to-deposit-to-delivery workflow must save more effort than a seller's free alternatives.

Do not pitch the product as unprecedented. The opportunity is a simpler, India-focused, one-time purchase for a narrow buyer who wants a personal tool instead of setting up broader software. Whether that convenience is valuable enough remains to be tested.

## Options considered

| Option | Fits zero AI/backend? | Commercial difficulty | Decision |
| --- | --- | --- | --- |
| Caption or hashtag tool | Only with fixed templates | Crowded; difficult to demonstrate a sales benefit | Reject |
| Automated DM/customer inbox | Poor fit | Platform integration, permissions and maintenance | Reject for this constraint |
| Invoice/quote generator alone | Yes | Strong free alternatives | Not enough by itself |
| Product cost calculator | Yes | Useful but often a one-off task; free spreadsheets compete | Possible later add-on |
| Custom-order desk | Yes, with local records | Requires manual entry and backups | Build and test first |

## What the working prototype does

1. Add an enquiry once, with product, quantity, price, pickup/delivery date and customer contact details.
2. Calculate order total, deposit remaining and balance. Optional total cost shows an estimated profit privately.
3. Generate a customer quote as copyable text, a PNG image, or a browser print/PDF. Cost/profit is excluded.
4. Move the order through enquiry, quote sent, booked/making, and completed. Keep cancelled records separately.
5. Show due follow-ups and generate editable, fixed-template messages. Opening Instagram or WhatsApp is an explicit action; the seller sends the message.
6. Save locally, export orders to CSV, and back up/restore all data as JSON. Download the single HTML app for offline use.

Sample orders are fictional and stored separately from real orders. The owner preview is fully usable. It does not enforce paid access and cannot take payment.

## Price and trial

Proposed launch price: **₹499 once per business for the current offline edition.** Test ₹299 for the first 10 paying customers in return for one short usage conversation; clearly disclose that this is an early version. Do not promise lifetime development or unlimited personal support.

The price is a hypothesis, not a research finding. A ₹499 purchase is easier to justify if it prevents one missed balance or regularly saves administrative effort. Do not claim those savings have already happened.

Public trial: a sample workspace and one free, usable branded quote. No signup and no card. All calculations happen on the visitor's device. Let people see the useful result before paying.

For a no-backend launch, publish the sample-only edition and manually deliver the full downloadable edition after verifying payment through the business's existing payment channel. The full preview currently provided here is not the sample-only commercial edition. Before public sales, split the two builds, connect a real purchase/contact destination, and replace all preview copy.

A client-only paywall or hidden button is not secure access control. The downloadable edition can be copied. Avoid promising strong piracy protection with a zero-server architecture. Automated checkout, protected accounts and automatic delivery are separate production work, not implemented here.

## Find customers through Instagram

Start with one niche and city: Kolkata home bakers, then one comparable market. Look for recent custom-order posts, a “DM/WhatsApp to order” bio, advance-booking instructions, and signs of repeated paid orders. Follower count alone does not establish budget. The existing 200–7,000 follower brand range is a starting search filter, not a buying rule.

Prioritise owners taking enough custom orders to feel the tracking problem, but not already using a satisfactory shop-management system. Do not prioritise people simply because they replied to ATOMZ about influencer collaborations: this is a different offer.

Permission-first opener to adapt to an actual profile:

> Hi [name], I saw you take custom [cakes/hampers] through DMs. I built a small order desk that keeps the quote, advance and delivery date together. It’s ₹499 once, with no monthly fee. Would you like a quick demo using a sample order for your business?

Only mention details visible on that account. Do not invent a lost sale or unpaid deposit. This outreach has not been sent.

## Low-cost sales experiments

1. **Sell with their output.** After they agree, make a fictional quote using their public business name and one publicly listed product. They receive a useful sample, not a generic software pitch. Use no real customer data.
2. **Let them bring one order.** On a short call, enter a live order with the owner's consent, create the quote and show the balance. Let the demonstrated convenience decide the sale; no survey is needed.
3. **Pilot credit.** Offer the ₹299 early-buyer price, with a clearly stated seven-day refund policy if ATOMZ can honour it. This is proposed, not an active promise in the demo.
4. **One owner introduces another.** After a buyer actually uses the desk, offer a fixed referral credit from the next completed sale. Record credits manually; do not create a referral backend yet.

These are practical experiments, not claims of never-before-used tactics.

## Decide whether to continue

Use a small offer test: 20 carefully selected, individually contacted sellers. Track relevant replies, accepted demos, actual purchases, and whether buyers use the tool on at least three real orders over a week. Proposed initial success criterion: three paid purchases and repeat use by at least two buyers. These are decision thresholds, not predicted conversion rates.

Ask why each nonbuyer declined. If the recurring objection is “I need my messages imported automatically” or “I need multi-device/team sync,” this edition does not solve their core problem. Change the niche or scope rather than disguising that limitation. If buyers will only use a free spreadsheet, do not keep polishing this product indefinitely.

## Cost and website integration

The prototype is one self-contained HTML file with embedded CSS and JavaScript. No libraries, external fonts, analytics, AI services or runtime API calls are required. Browser storage holds orders. The local server only delivers the HTML for the preview.

Deploy under `atomz.online/tools/order-desk/` if the existing website supports static assets, or link a subdomain. Inspect the actual website's hosting and routing before choosing the integration method. No live website changes have been made. Keep a stable origin: switching domains or opening the downloaded file uses different browser storage; use backup/restore to move data.

[Cloudflare Pages](https://pages.cloudflare.com/) currently advertises a free tier with unlimited static requests and bandwidth; [documented limits](https://developers.cloudflare.com/pages/platform/limits/) still apply. The existing domain, selling time, support and any payment-provider charges remain business costs. “No AI or application-server bill” is accurate; “the entire business costs nothing forever” is not.

Do not put all customers' data on Raj's laptop. Each buyer has their own local workspace. Cloud sync, automatic reminders while the app is closed, collaborative access, payment verification and integrated checkout would require additional infrastructure or services.
