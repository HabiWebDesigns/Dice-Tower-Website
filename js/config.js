/* ===== Dice Tower: js/config.js =====
   The only file you need to edit to connect the website to Google Sheets. */

const SITE_CONFIG = {

  // Link from Google Sheets: File > Share > Publish to web > pick the MENU tab > CSV > Publish.
  // Leave as "" to show the sample menu.
  MENU_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWcy1Cnn65dRl7RQA0Rjodv2akGCU02pbiSzWqHLic_JpGwVAChcSoq8gYe-WC-KH6xnUM9qtH7Ef5/pub?gid=265654146&single=true&output=csv",

  // Same steps, but pick the EVENTS tab. Leave as "" to show the sample events.
  EVENTS_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWjBBF5dd5pSNRP0spW88YoUjGUzw81h2o22nlijhOmAQLxrot03t6SiES2pd8ZKQ_FKPyhgtmnMJC/pub?gid=679123346&single=true&output=csv",

  // Reservation requests are sent to this email through FormSubmit (formsubmit.co).
  // The first request triggers an activation email from FormSubmit: click the link in it once.
  RESERVATION_EMAIL: "cantosherbie@gmail.com",

  // ----- Order page (order.html). All optional: delete or leave as is to use the defaults. -----
  // Orders are emailed here through FormSubmit. If left empty, RESERVATION_EMAIL above is used.
  ORDER_EMAIL: "",

  // Food photos: put image files in this folder (the menu sheet can also have an "Image" column).
  ORDER_IMAGE_FOLDER: "images/menu/",

  // true = if an item has no Image in the sheet, look for images/menu/<item-name>.jpg (or .png / .webp),
  // for example images/menu/spanish-latte.jpg
  ORDER_PHOTO_BY_NAME: true,

  // Payment: customers scan images/instapay-qr.png (replace that file to change the QR) and must upload
  // a screenshot of their receipt before the Send order button appears. The website does not check the payment.
  // Largest proof file accepted, in MB (photos are shrunk automatically first). FormSubmit allows about 10 MB in total.
  ORDER_PROOF_MAX_MB: 5,

  // Optional extra line shown under the QR code, for example the account name. Use "" to hide it.
  ORDER_PAYMENT_NOTE: "",

  // Opening hours in 24-hour time (Philippine time). 11 to 20 = 11:00 AM to 8:00 PM.
  OPEN_DAYS: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  OPEN_HOUR: 11,
  CLOSE_HOUR: 20
};
