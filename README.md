# PHANTOM VI Website (Static)

This is a static website (HTML/CSS/JS) with:
- Product ordering cart
- Add-ons (Label Design, Insurance, Barcode Registration)
- Customer delivery details form
- Optional Google Sheets order logging + Admin dashboard (no server required)

## How checkout works
1. User adds bottles to cart.
2. User selects add-ons (if needed).
3. User fills **Delivery Details** (name, phone, address).
4. User clicks:
   - **Pay with Yoco** (payment link)
   - **Send order via WhatsApp** (auto message)

## Google Sheets: monitor every sale (Admin page)
The site can log each order into Google Sheets using **Google Apps Script**.

### Step 1) Create the Apps Script Web App
1. Open your Google Sheet:
   - Sheet link you shared: `https://docs.google.com/spreadsheets/d/1gSn7HKFnb3kcVapB-WdJt4X0AAQyYNwXuQFBiORotic/edit`
   - Spreadsheet ID: `1gSn7HKFnb3kcVapB-WdJt4X0AAQyYNwXuQFBiORotic`
2. In the Sheet: **Extensions → Apps Script**
3. Create a new file (or replace `Code.gs`) with the code below.

### Step 2) Deploy
1. Click **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone** (or "Anyone with the link")
5. Deploy and copy the Web App URL (ends with `/exec`)

### Step 3) Paste URL into the Admin page
1. Open `admin.html`
2. Paste the Web App URL
3. (Optional) Set an Admin Token

Now, whenever a customer clicks WhatsApp or Yoco, the order is logged.

---

## Apps Script (Code.gs)
> Optional: set a token so random people can’t read your orders.

```javascript
const SPREADSHEET_ID = '1gSn7HKFnb3kcVapB-WdJt4X0AAQyYNwXuQFBiORotic';
const SHEET_NAME = 'Orders';

// Optional security token (leave empty to disable)
const ADMIN_TOKEN = ''; // e.g. 'phantomvi_admin_2026'

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow([
      'timestamp',
      'orderId',
      'channel',
      'customerName',
      'customerPhone',
      'customerAddress',
      'customerCity',
      'customerPostal',
      'customerNotes',
      'totalBottles',
      'itemsSubtotal',
      'courierFee',
      'addonsSummary',
      'addonsTotal',
      'grandTotal',
      'itemsSummary'
    ]);
  }
  return sh;
}

function checkToken_(e) {
  if (!ADMIN_TOKEN) return true;
  const t = (e && e.parameter && e.parameter.token) ? String(e.parameter.token) : '';
  return t === ADMIN_TOKEN;
}

function doPost(e) {
  // token check (optional)
  if (!checkToken_(e)) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'bad token' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sh = getSheet_();
  const body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  const data = JSON.parse(body);

  const ts = new Date();
  const c = data.customer || {};

  sh.appendRow([
    ts.toISOString(),
    data.orderId || '',
    data.channel || '',
    c.name || '',
    c.phone || '',
    c.address || '',
    c.city || '',
    c.postal || '',
    c.notes || '',
    Number(data.totalBottles || 0),
    Number(data.itemsSubtotal || 0),
    Number(data.courierFee || 0),
    data.addonsSummary || '',
    Number(data.addonsTotal || 0),
    Number(data.grandTotal || 0),
    data.itemsSummary || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  // token check (optional)
  if (!checkToken_(e)) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'bad token' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const mode = e && e.parameter && e.parameter.mode ? String(e.parameter.mode) : '';
  if (mode !== 'orders') {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, sheetUrl: SpreadsheetApp.openById(SPREADSHEET_ID).getUrl() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = getSheet_();
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, sheetUrl: ss.getUrl(), orders: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const header = values[0];
  const rows = values.slice(1).reverse(); // newest first

  const orders = rows.slice(0, 200).map(r => {
    const o = {};
    header.forEach((h, i) => (o[h] = r[i]));
    return {
      timestamp: o.timestamp,
      channel: o.channel,
      totalBottles: o.totalBottles,
      addonsSummary: o.addonsSummary,
      grandTotal: o.grandTotal,
      itemsSummary: o.itemsSummary
    };
  });

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, sheetUrl: ss.getUrl(), orders }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## Notes
- This website is static: you can host it on GitHub Pages / Netlify / any static hosting.
- Orders are logged when the user clicks WhatsApp or Yoco (so you can track intent + payment link clicks).
