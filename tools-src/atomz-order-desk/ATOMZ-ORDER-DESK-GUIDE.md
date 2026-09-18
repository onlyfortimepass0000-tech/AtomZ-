# ATOMZ Order Desk — Complete Guide

## Where the tool is saved

The main product folder is saved here:

`/Users/rajdeepmalladeb/.codex/.chatgpt-projects/g-p-6a8f074438d881918f63d40bd50081dc/atomz-order-desk/`

The ready-to-open standalone website is here:

`/Users/rajdeepmalladeb/.codex/.chatgpt-projects/g-p-6a8f074438d881918f63d40bd50081dc/atomz-order-desk/dist/index.html`

The local server file is here:

`/Users/rajdeepmalladeb/.codex/.chatgpt-projects/g-p-6a8f074438d881918f63d40bd50081dc/atomz-order-desk/serve.mjs`

The source files used to build the website are inside:

`/Users/rajdeepmalladeb/.codex/.chatgpt-projects/g-p-6a8f074438d881918f63d40bd50081dc/atomz-order-desk/src/`

The test and simulation results are inside:

`/Users/rajdeepmalladeb/.codex/.chatgpt-projects/g-p-6a8f074438d881918f63d40bd50081dc/atomz-order-desk/checks/`

## How to start it

Open Terminal and paste:

```sh
cd "/Users/rajdeepmalladeb/.codex/.chatgpt-projects/g-p-6a8f074438d881918f63d40bd50081dc"
node atomz-order-desk/serve.mjs
```

Then open this address in your browser:

`http://127.0.0.1:4188/`

Keep the Terminal window running while you use the local website. To stop the server, click that Terminal window and press `Control + C`.

If Terminal says that port 4188 is already being used, the site is probably already running. Open the address above. If it is not running, use this alternative:

```sh
cd "/Users/rajdeepmalladeb/.codex/.chatgpt-projects/g-p-6a8f074438d881918f63d40bd50081dc"
ORDER_DESK_PORT=4189 node atomz-order-desk/serve.mjs
```

Then open:

`http://127.0.0.1:4189/`

## What the product is

ATOMZ Order Desk is a lightweight order-management tool for Instagram sellers, home bakers, custom gift sellers, handmade-product businesses, and other small sellers who receive enquiries through Instagram or WhatsApp.

It keeps the essential information for every custom order in one place:

- who the customer is;
- what they are ordering;
- how much the order costs;
- how much has been received;
- how much is still due;
- when the order must be delivered or collected;
- whether the order is an enquiry, quote, active job, completed order, or cancelled order; and
- what needs to happen next.

The tool is intentionally simple. It does not use AI, does not automatically send messages, does not read Instagram, and does not require a paid API.

## The four main areas

### 1. Today

Today is the home screen. It is designed to answer the seller’s first questions immediately:

- What deliveries are due?
- Who needs a follow-up?
- How much money is still to be collected?
- How many open orders exist?

The top numbers show deliveries due, money to collect, and open orders. Under that, “Next up” shows the small list of actions that deserve attention.

The Next up area has two tabs:

- Deliveries: orders due today or already overdue.
- Follow-ups: enquiries, deposit reminders, balance reminders, and other conversations that need attention.

Each item has a direct action. For a delivery, you can record a payment or complete the order. For a follow-up, you can prepare a message or open the order details.

Today also shows two visual summaries:

- Payments: a ring showing the approximate collected percentage, plus received and outstanding amounts.
- Completed this week: bars showing completed order value by recent delivery date.

The charts are interactive. Tapping a payment amount opens related orders. Tapping a chart day lets you open the completed orders for that date.

### 2. Orders

Orders is the searchable list of the full workspace. Use it when you want to find a particular customer or inspect orders beyond today’s tasks.

You can search by:

- customer name;
- product name; or
- order number.

The filter menu lets you show open orders, all orders, enquiries, quoted orders, orders in progress, completed orders, unpaid orders, received orders, orders needing attention, or cancelled orders.

Each row gives a compact summary. Tap the row to open the full order. The list is paginated after larger numbers of records so the page stays quick even when the workspace grows.

### 3. Overview

Overview is for understanding the shop rather than handling one customer.

It shows:

- completed order value for the recent week;
- received money and outstanding money;
- the number of orders in each stage;
- estimated profit for completed orders where a private cost was entered.

Estimated profit is calculated as order value minus the cost entered by the seller. It is an internal estimate. It is not a tax report, accounting statement, or bank balance.

The stage bars are clickable. Selecting a stage takes you to the matching orders.

### 4. Settings

Settings contains the shop identity and data tools.

You can edit:

- shop name;
- Instagram handle; and
- the terms that appear on customer quotes.

Settings also shows the approximate number of stored orders and the size of the saved text records. The product supports up to 10,000 orders and has a 12 MB record-data safety limit. This is far more than a normal small seller should need because the product stores text, dates, and numbers rather than photos or videos.

## How to add an order

Tap “+ New order”. The first form shows only four essential fields:

1. Customer name.
2. Order or product.
3. Price per item.
4. Delivery or pickup date.

After entering those fields, the tool immediately calculates the total, deposit due, and remaining balance.

If you need more information, open “Payment, contact & other details”. This keeps the normal flow short while still allowing detailed records.

The optional section includes:

- quantity;
- delivery charge;
- amount already received;
- booking deposit percentage;
- order stage;
- next follow-up date;
- Instagram handle;
- WhatsApp number;
- private total cost; and
- customer notes.

When you save, the order is stored and the detail view opens immediately. This lets you continue with the next action without searching for the new record.

## Order stages

The order stage describes where the customer or job currently stands:

- Enquiry: the customer has asked or shown interest.
- Quoted: you have sent the quote or price details.
- In progress: the booking is confirmed and the work is underway.
- Completed: the order has been delivered or collected.
- Cancelled: the order is no longer active but remains available for reference.

The tool does not change a stage automatically based on a payment unless you choose “Confirm this booking” in the payment window. The seller remains responsible for deciding whether a payment has actually been received and whether the booking is confirmed.

## Recording payments

Open an order and select “Record payment”. The tool shows the remaining balance and suggests the pending deposit or full balance where appropriate.

You can enter a partial payment or use a preset amount. The tool refuses a payment that is larger than the remaining balance, which prevents accidental over-recording.

For enquiries and quotes, you can tick “Confirm this booking” while recording the payment. This changes the stage to In progress.

For a delivery, record the final payment first if needed, then choose Complete order. If money remains due, the tool asks you to confirm before completing the order and keeps the remaining balance visible.

## Quotes

Inside an order, “View quote” creates a customer-facing quotation from that record. The quote contains:

- shop name;
- quotation number;
- customer name;
- product and quantity;
- delivery charge;
- total;
- booking deposit;
- amount already received;
- remaining balance;
- delivery or pickup date;
- customer notes; and
- shop terms.

The private cost is never placed in the customer quote.

You can copy the quote as text, save it as a PNG image, or print/save it as a PDF. After you have sent it yourself, use “Mark quote sent” to move the order from Enquiry to Quoted.

## Follow-up messages

Follow-up messages are prepared locally from the order details. They are not sent automatically.

Depending on the order, the tool prepares a message for:

- an unanswered enquiry;
- a pending deposit;
- an outstanding balance; or
- a final delivery check-in.

You can edit the message, copy it, and open Instagram or WhatsApp if the corresponding contact detail exists. After you send it yourself, choose “Sent · remind in 2 days”. If you are not ready, choose “Remind tomorrow”.

This keeps communication under the seller’s control and avoids blindly sending the wrong message.

## Data storage

The tool has two storage layers:

1. IndexedDB is used when the browser supports it. Orders are stored as individual records, which is more suitable for a growing list than keeping one large text blob.
2. Local browser storage is used as a fallback when IndexedDB is unavailable.

Data is separated by the website address and browser profile. The data saved on `127.0.0.1:4188` will not automatically appear on another computer, another browser, a different port, or a future hosted address.

The app does not upload customer information to a server in its current local version. There is no cloud database, account system, background processor, or recurring storage bill for this version.

The important limitation is that browser data can be lost if the user clears site data, uses private browsing, changes browser profiles, or deletes the local browser storage. That is why the backup feature exists.

## Backups and moving to another device

Go to Settings and choose “Download backup”. The app downloads a JSON file containing the current shop details and orders.

Keep that file somewhere safe. It contains customer information, so treat it as private. You can store it in a protected folder, iCloud Drive, Google Drive, or another place you trust.

To move the workspace:

1. Open Order Desk on the new device.
2. Go to Settings.
3. Choose Restore.
4. Select the downloaded JSON backup.
5. Confirm the restore.

Before restoring, the current workspace is downloaded as a backup so the previous copy can be recovered.

CSV export is also available. CSV is useful for viewing or analysing orders in Excel, Numbers, or Google Sheets. JSON is the correct format for restoring the complete workspace because it preserves the structured data.

## Sample mode and personal mode

The sample shop is fictional and exists so someone can understand the product without entering real data. “Use my own orders” switches to the personal workspace.

The two workspaces are separate. Resetting the sample shop does not change the personal workspace. Switching back to the sample shop does not delete personal orders.

## Mobile use

The main use case is a phone. The mobile layout uses:

- a bottom navigation bar;
- a floating New order button;
- large touch targets;
- a short first order form;
- expandable optional fields;
- compact order rows; and
- bottom-sheet style dialogs.

The important actions are reachable without opening a desktop-style sidebar. The page was checked at a 390-pixel mobile width with no horizontal overflow.

## Daily workflow example

A normal day can look like this:

1. Open Today.
2. Check deliveries due and follow-ups.
3. Tap a follow-up and copy the prepared message into Instagram or WhatsApp.
4. When a customer agrees, open the order and record the verified deposit.
5. Confirm the booking.
6. Update the delivery date or notes if anything changes.
7. On delivery day, record the balance.
8. Mark the order complete.
9. Open Overview later to see received money, outstanding money, completed value, and estimated profit.
10. Download a backup regularly, especially before clearing browser data or changing devices.

## Interaction simulation

A seeded fictional shop was run through a week of new enquiries, quotes, deposits, balance payments, deliveries, follow-ups, edits, and cancellations.

The simulation estimated an average of about 54 control interactions per day for a busy week containing roughly:

- 2 to 4 new orders per day;
- 1 to 3 follow-ups per day;
- three quotes per week;
- three deposit actions per week;
- two balance actions per week;
- one delivery action per week;
- four edits per week; and
- four cancellations per week.

That number is a designed test scenario, not a market survey or a claim about every seller. It counts taps and field submissions, not individual keystrokes, scrolling, date-picker steps, or the separate action of sending a message in Instagram or WhatsApp.

The simulation also validated a 10,000-order workspace. The core data functions validated that workspace in about 43 milliseconds in the test environment, and summary/search operations took about 26 milliseconds. Actual browser speed will vary by device.

## What this version does not do

The current local version does not:

- automatically read Instagram messages;
- automatically send Instagram or WhatsApp messages;
- verify bank or payment-provider transactions;
- sync between devices;
- create user accounts or permissions;
- collect online payments;
- calculate taxes; or
- provide a hosted database.

Those are separate product additions. They would require a hosted backend, authentication, data-security rules, a payment plan, and a recurring operating cost.

## How this becomes a paid ATOMZ product

The current version is a strong low-cost prototype and local demo. To sell it from `atomz.online`, the next commercial layer would be:

1. Publish the interface under an ATOMZ address.
2. Add sign-in so each seller has a private workspace.
3. Move personal orders into a hosted database.
4. Add automatic encrypted backups and cross-device sync.
5. Add payments or a manual activation system.
6. Add a clear free trial and a small paid plan.

That hosted version would no longer be zero-cost to operate because each customer would create stored data and require secure access. The local version remains free to run because the customer’s browser stores the records.

## Quick reference

Local address: `http://127.0.0.1:4188/`

Project folder: `/Users/rajdeepmalladeb/.codex/.chatgpt-projects/g-p-6a8f074438d881918f63d40bd50081dc/atomz-order-desk/`

Ready website: `/Users/rajdeepmalladeb/.codex/.chatgpt-projects/g-p-6a8f074438d881918f63d40bd50081dc/atomz-order-desk/dist/index.html`

Guide: `/Users/rajdeepmalladeb/.codex/.chatgpt-projects/g-p-6a8f074438d881918f63d40bd50081dc/atomz-order-desk/ATOMZ-ORDER-DESK-GUIDE.md`
