/* ===== Dice Tower: js/order.js =====
   Runs order.html only. It reads the SAME menu Google Sheet as the main site (see js/config.js).
   Sheet columns used: Category, Name, Price, Description, Available, and optionally Image (or Photo). */

/* ---------- Settings (extra ones are optional in config.js) ---------- */
const ORDER = {
  email: SITE_CONFIG.ORDER_EMAIL || SITE_CONFIG.RESERVATION_EMAIL,
  imageFolder: SITE_CONFIG.ORDER_IMAGE_FOLDER || "images/menu/",
  photoByName: SITE_CONFIG.ORDER_PHOTO_BY_NAME !== false,
  payNote: SITE_CONFIG.ORDER_PAYMENT_NOTE === undefined ? "Payment is made at the cafe." : SITE_CONFIG.ORDER_PAYMENT_NOTE,
  openLabel: ((SITE_CONFIG.OPEN_HOUR + 11) % 12 + 1) + ":00 " + (SITE_CONFIG.OPEN_HOUR < 12 ? "AM" : "PM"),
  firstTime: String(SITE_CONFIG.OPEN_HOUR).padStart(2, "0") + ":00",
  lastTime: String(SITE_CONFIG.CLOSE_HOUR - 1).padStart(2, "0") + ":30"
};

/* Same sample menu as the main site, used if the sheet cannot be loaded. */
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

/* ---------- Helpers (same approach as js/script.js) ---------- */
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

function priceNumber(value) {
  const n = parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}
function money(n) {
  return "\u20B1" + n.toLocaleString("en-PH", { maximumFractionDigits: 2 });
}

/* ---------- Photos ---------- */
function slug(name) {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function resolveImage(value) {
  const drive = value.match(/drive\.google\.com\/file\/d\/([^/]+)/) ||
                value.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([^&]+)/);
  if (drive) return "https://drive.google.com/thumbnail?id=" + drive[1] + "&sz=w800"; // Drive share link
  if (/^(https?:)?\/\//.test(value) || value.startsWith("data:")) return value;        // full web link
  return ORDER.imageFolder + value.replace(/^\/+/, "");                                 // file name in the images folder
}
function photoCandidates(item) {
  const given = item.image || item.photo;
  if (given) return [resolveImage(given)];
  if (!ORDER.photoByName) return [];
  const base = ORDER.imageFolder + slug(item.name);
  return [base + ".jpg", base + ".png", base + ".webp"];
}
/* Show a photo only once it has loaded, so no broken-image icon ever appears. */
document.addEventListener("load", e => {
  if (e.target instanceof HTMLImageElement && e.target.closest(".photo")) e.target.classList.add("loaded");
}, true);
/* If a photo fails to load, try the next candidate, then fall back to the drawn icon. */
document.addEventListener("error", e => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !img.dataset.alts) return;
  const next = img.dataset.alts.split("|").filter(Boolean);
  if (next.length) { img.dataset.alts = next.slice(1).join("|"); img.src = next[0]; }
  else img.remove();
}, true);

const SVG_NS = "http://www.w3.org/2000/svg";
function icon(item) {
  const drink = /coffee|espresso|drip|tea|drink|latte|brew|chocolate|matcha|soda|juice/i.test(item.category + " " + item.name);
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#f2dcc0");
  path.setAttribute("stroke-width", "4");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("d", drink
    ? "M12 24h34v14a14 14 0 0 1-14 14h-6a14 14 0 0 1-14-14zM46 28h4a6 6 0 0 1 0 12h-4M20 10v6M30 10v6M40 10v6"
    : "M8 38h48a24 24 0 0 1-48 0zM14 30a18 14 0 0 1 36 0");
  svg.appendChild(path);
  return svg;
}

/* ---------- Menu ---------- */
let items = [];
let activeCategory = "All";
let cart = {};          // item index -> quantity
let savedCart = {};     // item name -> quantity (survives page reloads and sheet re-ordering)
let menuNote = "";

try { savedCart = JSON.parse(localStorage.getItem("dt-cart") || "{}"); } catch (e) { savedCart = {}; }
function persist() {
  try {
    const out = {};
    for (const i in cart) if (items[i]) out[items[i].name] = cart[i];
    localStorage.setItem("dt-cart", JSON.stringify(out));
  } catch (e) { /* storage may be blocked; the cart still works for this visit */ }
}

function controls(i) {
  const n = cart[i] || 0;
  const wrap = document.createDocumentFragment();
  const plus = el("button", "rnd", "+");
  plus.type = "button"; plus.dataset.act = "plus"; plus.dataset.i = i;
  plus.setAttribute("aria-label", "Add " + items[i].name);
  if (!n) { wrap.appendChild(plus); return wrap; }
  const minus = el("button", "rnd minus", "\u2212");
  minus.type = "button"; minus.dataset.act = "minus"; minus.dataset.i = i;
  minus.setAttribute("aria-label", "Remove one " + items[i].name);
  const qty = el("span", "qty", String(n));
  qty.setAttribute("aria-label", n + " in your order");
  wrap.append(minus, qty, plus);
  return wrap;
}

function buildTabs() {
  const tabs = document.getElementById("menuTabs");
  tabs.innerHTML = "";
  const categories = ["All", ...new Set(items.map(i => i.category).filter(Boolean))];
  if (!categories.includes(activeCategory)) activeCategory = "All";
  categories.forEach(cat => {
    const b = el("button", "tab", cat);
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", cat === activeCategory ? "true" : "false");
    b.addEventListener("click", () => {
      activeCategory = cat;
      document.getElementById("menuSearch").value = "";
      buildTabs(); renderMenu();
    });
    tabs.appendChild(b);
  });
}

function renderMenu() {
  const list = document.getElementById("menuList");
  const status = document.getElementById("menuStatus");
  const q = document.getElementById("menuSearch").value.trim().toLowerCase();
  list.innerHTML = "";

  const shown = items.map((it, i) => ({ it, i })).filter(({ it }) =>
    (activeCategory === "All" || it.category === activeCategory) &&
    (!q || (it.name + " " + it.description + " " + it.category).toLowerCase().includes(q)));

  if (!shown.length) {
    status.textContent = q ? 'No items match "' + q + '". Try a different word.' : "The menu is empty right now.";
    return;
  }
  status.textContent = menuNote;

  let lastCat = null;
  shown.forEach(({ it, i }) => {
    if (activeCategory === "All" && it.category !== lastCat) {
      list.appendChild(el("h3", "food-cat", it.category));
      lastCat = it.category;
    }
    const available = yes(it.available);
    const card = el("article", "food" + (available ? "" : " sold-out"));
    card.dataset.i = i;

    const photo = el("div", "photo");
    photo.appendChild(icon(it));
    const cands = photoCandidates(it);
    if (cands.length) {
      const img = document.createElement("img");
      img.alt = ""; // the name is already written next to the photo
      img.loading = "lazy";
      img.dataset.alts = cands.slice(1).join("|");
      img.src = cands[0];
      photo.appendChild(img);
    }

    const body = el("div", "food-body");
    body.appendChild(el("h4", "food-name", it.name));
    if (it.description) body.appendChild(el("p", "food-desc", it.description));
    const row = el("div", "food-row");
    row.appendChild(el("span", "food-price", money(priceNumber(it.price))));
    if (available) {
      const ctl = el("div", "ctl");
      ctl.appendChild(controls(i));
      row.appendChild(ctl);
    } else {
      row.appendChild(el("span", "sold-tag", "Sold out"));
    }
    body.appendChild(row);
    card.append(photo, body);
    list.appendChild(card);
  });
}

/* ---------- Cart ---------- */
function totals() {
  let count = 0, total = 0;
  for (const i in cart) if (items[i]) { count += cart[i]; total += cart[i] * priceNumber(items[i].price); }
  return { count, total };
}

function renderCart() {
  const lines = document.getElementById("cartLines");
  lines.innerHTML = "";
  Object.keys(cart).filter(i => items[i]).forEach(i => {
    const it = items[i], n = cart[i];
    const li = el("li", "cart-line");
    li.dataset.i = i;
    li.append(el("span", "nm", it.name), el("span", "sum", money(n * priceNumber(it.price))));
    li.appendChild(el("span", "each", money(priceNumber(it.price)) + " each"));
    const ctl = el("div", "ctl");
    ctl.appendChild(controls(i));
    li.appendChild(ctl);
    lines.appendChild(li);
  });
  const { count, total } = totals();
  document.getElementById("cartEmpty").hidden = count > 0;
  document.getElementById("cartTotal").textContent = money(total);
  document.getElementById("count").textContent = count;
  document.getElementById("barCount").textContent = count;
  document.getElementById("barTotal").textContent = money(total);
  document.getElementById("cartBar").hidden = count === 0 || document.getElementById("cart").classList.contains("open");
}

function change(i, delta) {
  const n = Math.max(0, Math.min(20, (cart[i] || 0) + delta));
  if (n) cart[i] = n; else delete cart[i];
  persist();
  document.querySelectorAll('.food[data-i="' + i + '"] .ctl').forEach(c => { c.innerHTML = ""; c.appendChild(controls(i)); });
  renderCart();
}

document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const i = b.dataset.i, act = b.dataset.act;
  const inCart = !!b.closest(".cart-line");
  change(i, act === "plus" ? 1 : -1);
  // Keep keyboard focus on the same kind of button after the controls are redrawn.
  const scope = inCart ? '.cart-line[data-i="' + i + '"]' : '.food[data-i="' + i + '"]';
  const again = document.querySelector(scope + ' [data-act="' + act + '"]') || document.querySelector(scope + ' [data-act="plus"]');
  if (again) again.focus();
});

function openCart(open) {
  const cartEl = document.getElementById("cart");
  cartEl.classList.toggle("open", open);
  document.body.style.overflow = open && window.innerWidth <= 820 ? "hidden" : "";
  renderCart();
  if (open) document.querySelector(".cart-body").scrollTop = 0;
  if (open && window.innerWidth <= 820) document.getElementById("closeCart").focus();
}
document.getElementById("openCart").addEventListener("click", () => openCart(true));
document.getElementById("cartBar").addEventListener("click", () => openCart(true));
document.getElementById("closeCart").addEventListener("click", () => openCart(false));
document.addEventListener("keydown", e => { if (e.key === "Escape") openCart(false); });

/* ---------- Mobile nav ---------- */
(function initNav() {
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
})();

/* ---------- Checkout form ---------- */
function initForm() {
  const form = document.getElementById("orderForm");
  const status = document.getElementById("formStatus");
  const when = document.getElementById("when");
  when.min = ORDER.firstTime;
  when.max = ORDER.lastTime;
  document.getElementById("payNote").textContent = ORDER.payNote;

  const hour = parseInt(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Manila" }).format(new Date()), 10);
  if (hour < SITE_CONFIG.OPEN_HOUR || hour >= SITE_CONFIG.CLOSE_HOUR) {
    document.getElementById("closedNote").textContent = "We are closed right now. We will see your order when we open at " + ORDER.openLabel + ".";
  }

  document.getElementById("orderType").addEventListener("change", e => {
    document.getElementById("tableField").hidden = e.target.value !== "Dine-in";
  });

  const setError = (id, msg) => {
    document.getElementById(id + "Error").textContent = msg;
    document.getElementById(id).closest(".field").classList.toggle("invalid", !!msg);
    return !msg;
  };
  function validate() {
    const v = id => form.elements[id].value.trim();
    let ok = true;
    ok = setError("name", v("name").length < 2 ? "Enter your name." : "") && ok;
    const phone = v("phone").replace(/[\s-]/g, "");
    ok = setError("phone", /^(\+63|0)9\d{9}$/.test(phone) ? "" : "Use a Philippine mobile number, like 0917 123 4567.") && ok;
    const t = v("when");
    ok = setError("when", !t || (t >= ORDER.firstTime && t <= ORDER.lastTime) ? "" : "Choose a time between " + ORDER.firstTime + " and " + ORDER.lastTime + ", or leave it blank.") && ok;
    return ok;
  }

  form.addEventListener("input", e => { if (e.target.closest(".invalid")) validate(); });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    status.className = "form-status";
    const { count, total } = totals();
    if (!count) { status.textContent = "Your order is empty. Add at least one item first."; return; }
    if (!validate()) {
      status.textContent = "Fix the highlighted fields and send again.";
      const bad = form.querySelector(".invalid input");
      if (bad) bad.focus();
      return;
    }
    const f = form.elements;
    if (f._honey && f._honey.value) return; // hidden spam trap

    const orderId = "DT-" + Date.now().toString(36).toUpperCase().slice(-6);
    const lines = Object.keys(cart).filter(i => items[i]).map(i =>
      cart[i] + " x " + items[i].name + " (" + money(cart[i] * priceNumber(items[i].price)) + ")");

    const button = document.getElementById("sendBtn");
    button.disabled = true;
    status.textContent = "Sending your order...";

    const payload = {
      order_number: orderId,
      name: f.name.value.trim(),
      mobile: f.phone.value.trim(),
      order_type: f.orderType.value,
      table: f.table.value.trim() || "n/a",
      preferred_time: f.when.value || "as soon as possible",
      items: lines.join("\n"),
      total: money(total),
      notes: f.notes.value.trim() || "n/a",
      _subject: "New order " + orderId + " from " + f.name.value.trim(),
      _template: "table",
      _captcha: "false"
    };

    try {
      const res = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(ORDER.email), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || String(data.success) !== "true") throw new Error(data.message || "Request failed");
      document.getElementById("doneText").textContent =
        "Thanks, " + payload.name + ". Your order " + orderId + " (" + money(total) + ") was sent to the cafe.";
      cart = {}; persist();
      form.reset();
      document.getElementById("tableField").hidden = true;
      status.textContent = "";
      openCart(false);
      renderMenu(); renderCart();
      document.getElementById("overlay").hidden = false;
      document.getElementById("doneBtn").focus();
    } catch (err) {
      console.warn("Order failed:", err);
      const hint = location.protocol === "file:"
        ? " Open the site from your web host instead of the file on your computer, then try again."
        : "";
      status.textContent = "Sorry, the order did not go through." + hint + " Please try again, or order at the counter.";
    } finally {
      button.disabled = false;
    }
  });
}
document.getElementById("doneBtn").addEventListener("click", () => { document.getElementById("overlay").hidden = true; });

/* ---------- Start ---------- */
async function init() {
  const url = SITE_CONFIG.MENU_CSV_URL;
  const { rows, live } = await loadRows(url, SAMPLE_MENU);
  items = rows.filter(r => r.name);
  if (url && !live) menuNote = "Showing our regular menu. The live menu could not be loaded.";
  items.forEach((it, i) => { if (savedCart[it.name] && yes(it.available)) cart[i] = savedCart[it.name]; });
  buildTabs();
  renderMenu();
  renderCart();
  document.getElementById("menuSearch").addEventListener("input", renderMenu);
  initForm();
}
init();
