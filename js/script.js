/* ===== Dice Tower: js/script.js =====
   Settings (Google Sheet links, email) live in js/config.js. */

/* ---------- Built-in samples (used if no sheet link, or if loading fails) ---------- */
const SAMPLE_MENU = `Category,Name,Price,Description,Available
Espresso Bar,Espresso,90,Double shot of our house blend,Yes
Espresso Bar,Americano,110,Espresso with hot water,Yes
Espresso Bar,Cafe Latte,140,Espresso with steamed milk,Yes
Espresso Bar,Spanish Latte,160,Sweetened condensed milk latte,Yes
Espresso Bar,Caramel Macchiato,165,Vanilla milk with espresso and caramel drizzle,Yes
Espresso Bar,Mocha,160,Espresso with dark chocolate and milk,Yes
Specialty Drip,Single Origin Pour Over,150,Rotating beans. Ask what is on today,Yes
Specialty Drip,Iced Drip Coffee,130,Slow-dripped and served over ice,Yes
Specialty Drip,Cold Brew,140,Steeped for 18 hours,No
Pastries & Brunch,Butter Croissant,95,Flaky and baked every morning,Yes
Pastries & Brunch,Chocolate Chip Cookie,70,Big and chewy,Yes
Pastries & Brunch,Ham and Cheese Toastie,160,Grilled sourdough with melted cheese,Yes
Pastries & Brunch,Dragon Burger,240,Beef patty with cheese on a toasted bun,Yes
Pastries & Brunch,Tapsilog,220,Beef tapa with garlic rice and egg,Yes
Pastries & Brunch,Banana Bread,85,Served warm with butter,Yes
Non-Coffee / Tea,Matcha Latte,155,Ceremonial-grade matcha with milk,Yes
Non-Coffee / Tea,Hot Chocolate,130,Rich and not too sweet,Yes
Non-Coffee / Tea,Iced Lemon Tea,100,Black tea with fresh lemon,Yes
Non-Coffee / Tea,Chamomile Tea,95,Caffeine free,Yes`;

const SAMPLE_EVENTS = `Date,Time,Title,Description,Show
Every Friday,6:00 PM,Friday Night Magic,Standard tournament. Bring your deck and a friend.,Yes
Every Saturday,2:00 PM,Dungeons and Dragons One-Shot,Beginners welcome. Pre-made characters provided.,Yes
2026-10-25,3:00 PM,Latte Art Workshop,Learn to pour a heart and a rosetta. Limited seats.,Yes`;

/* ---------- CSV helpers ---------- */
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some(f => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some(f => f.trim() !== "")) rows.push(row);
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = (r[i] || "").trim());
    return obj;
  });
}

async function loadRows(url, sample) {
  if (url) {
    try {
      // The extra parameter makes the browser ask for a fresh copy every time.
      const freshUrl = url + (url.includes("?") ? "&" : "?") + "_=" + Date.now();
      const res = await fetch(freshUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return { rows: parseCSV(await res.text()), live: true };
    } catch (err) {
      console.warn("Could not load the Google Sheet, using the sample instead.", err);
    }
  }
  return { rows: parseCSV(sample), live: false };
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function yes(value, fallbackWhenBlank = true) {
  if (!value) return fallbackWhenBlank;
  return !/^(no|false|0|hide|hidden|sold out|soldout|x)$/i.test(value);
}

/* ---------- Menu ---------- */
let menuItems = [];
let activeCategory = "All";

function formatPrice(value) {
  const n = parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? value : "\u20B1" + n.toLocaleString("en-PH", { maximumFractionDigits: 2 });
}

function buildTabs() {
  const tabs = document.getElementById("menuTabs");
  tabs.innerHTML = "";
  const categories = ["All", ...new Set(menuItems.map(i => i.category).filter(Boolean))];
  if (!categories.includes(activeCategory)) activeCategory = "All";
  categories.forEach(cat => {
    const b = el("button", "tab", cat);
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", cat === activeCategory ? "true" : "false");
    b.addEventListener("click", () => { activeCategory = cat; buildTabs(); renderMenu(); });
    tabs.appendChild(b);
  });
}

function renderMenu() {
  const list = document.getElementById("menuList");
  const status = document.getElementById("menuStatus");
  const q = document.getElementById("menuSearch").value.trim().toLowerCase();
  list.innerHTML = "";

  const shown = menuItems.filter(i =>
    (activeCategory === "All" || i.category === activeCategory) &&
    (!q || (i.name + " " + i.description + " " + i.category).toLowerCase().includes(q))
  );

  if (!shown.length) {
    status.textContent = q ? 'No items match "' + q + '". Try a different word.' : "The menu is empty right now.";
    return;
  }
  if (!status.dataset.keep) status.textContent = "";

  let lastCat = null;
  shown.forEach(i => {
    if (activeCategory === "All" && i.category !== lastCat) {
      list.appendChild(el("h3", "menu-cat", i.category));
      lastCat = i.category;
    }
    const available = yes(i.available);
    const item = el("div", "menu-item" + (available ? "" : " sold-out"));
    const top = el("div", "menu-item-top");
    const name = el("span", "menu-name", i.name);
    if (!available) name.appendChild(el("span", "sold-tag", "Sold out"));
    top.append(name, el("span", "menu-price", formatPrice(i.price)));
    item.appendChild(top);
    if (i.description) item.appendChild(el("p", "menu-desc", i.description));
    list.appendChild(item);
  });
}

async function initMenu() {
  const url = SITE_CONFIG.MENU_CSV_URL;
  const { rows, live } = await loadRows(url, SAMPLE_MENU);
  menuItems = rows.filter(r => r.name);
  const status = document.getElementById("menuStatus");
  status.textContent = "";
  if (url && !live) {
    status.textContent = "Showing our regular menu. The live menu could not be loaded.";
    status.dataset.keep = "1";
  }
  buildTabs();
  renderMenu();
  document.getElementById("menuSearch").addEventListener("input", renderMenu);
}

/* ---------- Events ---------- */
function manilaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date()); // YYYY-MM-DD
}

function formatEventDate(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })
      .format(new Date(Date.UTC(y, m - 1, d)));
  }
  return value; // text such as "Every Friday"
}

async function initEvents() {
  const url = SITE_CONFIG.EVENTS_CSV_URL;
  const { rows, live } = await loadRows(url, SAMPLE_EVENTS);
  const status = document.getElementById("eventsStatus");
  const ul = document.getElementById("eventsList");
  const today = manilaToday();
  ul.innerHTML = "";
  status.textContent = "";

  const events = rows.filter(r => r.title)
    .filter(r => yes(r.show))                                        // Show = No hides an event
    .filter(r => !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || r.date >= today); // past dated events drop off

  events.forEach(r => {
    const li = el("li", "event");
    li.appendChild(el("p", "event-when", [formatEventDate(r.date), r.time].filter(Boolean).join(", ")));
    li.appendChild(el("h3", "", r.title));
    if (r.description) li.appendChild(el("p", "", r.description));
    ul.appendChild(li);
  });

  if (url && !live) status.textContent = "Showing our regular events. The latest events could not be loaded.";
  else if (!events.length) status.textContent = "No events posted right now. Check back soon, or ask at the counter.";
}

/* ---------- Open / closed badge ---------- */
function updateOpenStatus() {
  const badge = document.getElementById("openStatus");
  const hour = parseInt(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Manila" }).format(new Date()), 10);
  const open = hour >= SITE_CONFIG.OPEN_HOUR && hour < SITE_CONFIG.CLOSE_HOUR;
  badge.textContent = open ? "Open now, until 8:00 PM" : "Closed now. Open daily 11:00 AM to 8:00 PM";
  badge.classList.toggle("closed", !open);
}

/* ---------- Mobile nav ---------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  const setOpen = open => {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
}

/* ---------- Reservation form ---------- */
function initForm() {
  const form = document.getElementById("reserveForm");
  const status = document.getElementById("formStatus");
  const dateInput = document.getElementById("date");
  dateInput.min = manilaToday();

  const setError = (id, msg) => {
    document.getElementById(id + "Error").textContent = msg;
    document.getElementById(id).closest(".field").classList.toggle("invalid", !!msg);
    return !msg;
  };

  function validate() {
    const v = id => form.elements[id].value.trim();
    let ok = true;
    ok = setError("name", v("name").length < 2 ? "Enter your name." : "") && ok;
    ok = setError("email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email")) ? "" : "Enter a valid email, like name@email.com.") && ok;
    const phone = v("phone").replace(/[\s-]/g, "");
    ok = setError("phone", phone && !/^(\+63|0)9\d{9}$/.test(phone) ? "Use a Philippine mobile number, like 0917 123 4567." : "") && ok;
    const g = Number(v("guests"));
    ok = setError("guests", Number.isInteger(g) && g >= 1 && g <= 12 ? "" : "Enter 1 to 12 players. For bigger groups, message us.") && ok;
    ok = setError("date", !v("date") ? "Pick a date." : v("date") < dateInput.min ? "Pick today or a future date." : "") && ok;
    const t = v("time");
    ok = setError("time", !t ? "Pick a time." : (t < "11:00" || t > "19:30") ? "Choose a time between 11:00 AM and 7:30 PM." : "") && ok;
    return ok;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    status.className = "form-status";
    if (!validate()) {
      status.textContent = "Fix the highlighted fields and send again.";
      const firstBad = form.querySelector(".invalid input");
      if (firstBad) firstBad.focus();
      return;
    }
    const f = form.elements;
    if (f._honey && f._honey.value) return; // hidden spam trap: real visitors leave it empty

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = "Sending your request...";

    const payload = {
      name: f.name.value.trim(),
      email: f.email.value.trim(),
      mobile: f.phone.value.trim() || "n/a",
      players: f.guests.value,
      date: f.date.value,
      time: f.time.value,
      notes: f.notes.value.trim() || "n/a",
      _subject: "Table reservation: " + f.name.value.trim(),
      _template: "table",
      _captcha: "false"
    };

    try {
      const res = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(SITE_CONFIG.RESERVATION_EMAIL), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || String(data.success) !== "true") throw new Error(data.message || "Request failed");
      form.reset();
      dateInput.min = manilaToday();
      status.classList.add("ok");
      status.textContent = "Request sent. We will confirm your table by email or phone.";
    } catch (err) {
      console.warn("Reservation failed:", err);
      const hint = location.protocol === "file:"
        ? " Open the site from your web host instead of the file on your computer, then try again."
        : "";
      status.textContent = "Sorry, the request did not go through." + hint + " Please try again, or message us directly.";
    } finally {
      button.disabled = false;
    }
  });

  form.addEventListener("input", e => {
    if (e.target.closest(".invalid")) validate();
  });
}

/* ---------- Start ---------- */
initNav();
updateOpenStatus();
initMenu();
initEvents();
initForm();
