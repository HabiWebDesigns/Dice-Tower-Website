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

  // Opening hours in 24-hour time (Philippine time). 11 to 20 = 11:00 AM to 8:00 PM.
  OPEN_HOUR: 11,
  CLOSE_HOUR: 20
};
