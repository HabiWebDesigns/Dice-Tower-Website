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
  // The index no longer hosts the menu; online ordering owns that experience.
  if (!document.getElementById("menuList")) return;
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

function randomizePaperCuts(paper) {
  const edges = ["top", "right", "bottom", "left"];
  for (let i = edges.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [edges[i], edges[j]] = [edges[j], edges[i]];
  }

  const cuts = Object.fromEntries(edges.slice(0, 3).map(edge => [edge, {
    at: 15 + Math.random() * 70,
    depth: 1.8 + Math.random() * 1.5
  }]));
  const points = ["0% 0%"];
  const point = (x, y) => points.push(x + "% " + y + "%");
  const top = cuts.top;
  if (top) { point(top.at - 3, 0); point(top.at, top.depth); point(top.at + 3, 0); }
  point(100, 0);

  const right = cuts.right;
  if (right) { point(100, right.at - 3); point(100 - right.depth, right.at); point(100, right.at + 3); }
  point(100, 100);

  const bottom = cuts.bottom;
  if (bottom) { point(bottom.at + 3, 100); point(bottom.at, 100 - bottom.depth); point(bottom.at - 3, 100); }
  point(0, 100);

  const left = cuts.left;
  if (left) { point(0, left.at + 3); point(left.depth, left.at); point(0, left.at - 3); }

  paper.style.clipPath = "polygon(" + points.join(", ") + ")";
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
    randomizePaperCuts(li);
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
  const localParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "long",
    hour: "numeric",
    hourCycle: "h23"
  }).formatToParts(new Date()).reduce((parts, part) => {
    if (part.type !== "literal") parts[part.type] = part.value;
    return parts;
  }, {});
  const hour = Number(localParts.hour);
  const day = localParts.weekday;
  const open = SITE_CONFIG.OPEN_DAYS.includes(day) && hour >= SITE_CONFIG.OPEN_HOUR && hour < SITE_CONFIG.CLOSE_HOUR;
  const formatTime = value => `${value % 12 || 12}:00 ${value < 12 ? "AM" : "PM"}`;

  badge.querySelector(".status-label").textContent = open ? "Open now" : "Closed now";
  if (open) {
    badge.querySelector(".status-hours").textContent = `Until ${formatTime(SITE_CONFIG.CLOSE_HOUR)}`;
  } else {
    const today = new Date(Date.UTC(Number(localParts.year), Number(localParts.month) - 1, Number(localParts.day)));
    let nextOpening = "Check back soon";
    for (let daysAhead = 0; daysAhead <= 7; daysAhead += 1) {
      if (daysAhead === 0 && hour >= SITE_CONFIG.OPEN_HOUR) continue;
      const candidate = new Date(today);
      candidate.setUTCDate(candidate.getUTCDate() + daysAhead);
      const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(candidate);
      if (!SITE_CONFIG.OPEN_DAYS.includes(weekday)) continue;
      const when = daysAhead === 0 ? "today" : daysAhead === 1 ? "tomorrow" : weekday;
      nextOpening = `Opens ${when} at ${formatTime(SITE_CONFIG.OPEN_HOUR)}`;
      break;
    }
    badge.querySelector(".status-hours").textContent = nextOpening;
  }
  badge.classList.toggle("closed", !open);
  badge.classList.toggle("is-open", open);
}

function initTodayHours() {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "Asia/Manila"
  }).format(new Date());
  document.querySelectorAll("[data-hours-day]").forEach(row => {
    row.classList.toggle("is-today", row.dataset.hoursDay === weekday);
  });
}

/* ---------- Mobile nav ---------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;
  const setOpen = open => {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
}

/* ---------- Scroll reveals ---------- */
function initMotion() {
  const targets = document.querySelectorAll(".hero-text, .hero-art, .section-head, .events, .about-copy, .about-facts, .dice > div, .visit-info, .map-frame, .form, .order-page > .section-head, .order-layout > section, .cart");
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  targets.forEach(target => {
    target.classList.add("reveal");
    observer.observe(target);
  });
}

/* ---------- Featured TCG gallery ---------- */
function initTcgGallery() {
  const carousel = document.getElementById("tcgCarousel");
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll("[data-tcg-slide]")];
  const tabs = [...carousel.querySelectorAll("[data-tcg-tab]")];
  const intervalMs = 6000;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let timer = null;

  const stopAutoplay = () => {
    window.clearInterval(timer);
    timer = null;
  };
  const startAutoplay = () => {
    stopAutoplay();
    if (reducedMotion.matches || document.hidden) return;
    timer = window.setInterval(() => showSlide(activeIndex + 1), intervalMs);
  };
  const showSlide = index => {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === activeIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
    });
    tabs.forEach((tab, i) => {
      const active = i === activeIndex;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    startAutoplay();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => showSlide(i));
    tab.addEventListener("keydown", event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (i + direction + tabs.length) % tabs.length;
      showSlide(nextIndex);
      tabs[nextIndex].focus();
    });
  });
  document.addEventListener("visibilitychange", startAutoplay);
  reducedMotion.addEventListener("change", startAutoplay);
  startAutoplay();
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
initTodayHours();
initMenu();
initEvents();
initForm();
initMotion();
initTcgGallery();
