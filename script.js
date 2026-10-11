/* Dice Tower Board Game Cafe - behavior
   Quick customization:
   - MENU: categories, items, descriptions, prices (name, description, price in pesos)
   - EVENTS: title, day, time, description, filter category
   - HOURS and the open/closed check: HOURS list, and 660 / 1200 are opening and closing time in minutes (11:00 AM / 8:00 PM)
   - Address copied by the copy button: search for "Copy address"
   - Reservation form rules: the "rules" object */

const $ = (s, r = document) => r.querySelector(s);
const MENU = {
    "Espresso Bar": [["Critical Hit Espresso", "Double shot, dark and syrupy. One action, big damage.", 90], ["Mana Latte", "Espresso with steamed milk and a pour of vanilla.", 140], ["Cappuccino", "Equal parts espresso, milk, and foam.", 135], ["Spanish Latte", "Sweetened condensed milk, double espresso, silky milk.", 155], ["Americano", "Espresso over hot water. Hot or iced.", 100]],
    "Specialty Drip": [["Barako Pour-over", "Bold Batangas barako, brewed by hand.", 130], ["Single-Origin V60", "Rotating highland bean. Ask what is on rotation.", 160], ["Cold Brew", "Steeped 16 hours. Smooth and low acid.", 150], ["Cold Brew Tonic", "Cold brew over tonic and citrus. Bright and fizzy.", 165]],
    "Pastries & Brunch": [["Butter Croissant", "Flaky and baked each morning.", 95], ["Cheesy Egg Sandwich", "Soft egg, melty cheese, toasted brioche.", 150], ["Tapsilog Bowl", "Beef tapa, garlic rice, and a fried egg.", 175], ["Banana Bread", "Moist slice with brown butter.", 85], ["Fries Share Tray", "Crispy fries with dips. Easy to eat one-handed.", 130]],
    "Non-Coffee & Tea": [["Matcha Latte", "Ceremonial-style matcha with milk. Hot or iced.", 150], ["Dark Chocolate", "Rich cocoa for the long game.", 140], ["Hibiscus Iced Tea", "Tart, floral, and not too sweet.", 110], ["Calamansi Honey Soda", "Fresh calamansi, honey, and sparkling water.", 100]]
};
const EVENTS = [
    ["Friday Night Magic", "Fri", "6:00 PM", "Draft or Standard. Prize packs for top finishers, and new players welcome.", "Card games"],
    ["Commander Night", "Wed", "5:00 PM", "Four-player pods, any power level. We will match you to a table.", "Card games"],
    ["Pokémon and Lorcana League", "Thu", "5:00 PM", "Casual league play and deck help for beginners.", "Card games"],
    ["Dungeons and Dragons One-Shots", "Sat", "2:00 PM", "Pre-made characters, a game master, and a story that ends in one afternoon.", "Tabletop RPG"],
    ["Board Game Open Table", "Tue", "3:00 PM", "Borrow a game from the shelf. Staff will teach it to you.", "Tabletop RPG"],
    ["Latte Art Workshop", "Sun", "3:00 PM", "Learn to pour a heart and a rosetta with our baristas.", "Coffee"]
];
const HOURS = [["Monday", 1], ["Tuesday", 2], ["Wednesday", 3], ["Thursday", 4], ["Friday", 5], ["Saturday", 6], ["Sunday", 0]];
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* mobile nav */
const burger = $('#burger'), nav = $('#nav');
const setNav = o => { nav.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Close menu' : 'Open menu') };
burger.onclick = () => setNav(!nav.classList.contains('open'));
nav.addEventListener('click', e => { if (e.target.tagName === 'A') setNav(false) });
document.addEventListener('keydown', e => { if (e.key === 'Escape') setNav(false) });

/* menu */
let cat = Object.keys(MENU)[0];
const tabs = $('#tabs'), grid = $('#menuGrid'), q = $('#q');
Object.keys(MENU).forEach(c => { const b = document.createElement('button'); b.className = 'tab'; b.role = 'tab'; b.textContent = c; b.onclick = () => { cat = c; q.value = ''; renderMenu() }; tabs.append(b) });
function renderMenu() {
    const term = q.value.trim().toLowerCase();
    [...tabs.children].forEach(b => b.setAttribute('aria-selected', !term && b.textContent === cat));
    const list = [];
    for (const c in MENU) if (term || c === cat) MENU[c].forEach(i => { if (!term || (i[0] + ' ' + i[1]).toLowerCase().includes(term)) list.push([...i, c]) });
    grid.innerHTML = list.length ? list.map(i => `<article class="item"><h3>${esc(i[0])}<span class="cost">₱${i[2]}</span></h3><p>${esc(i[1])}</p><span class="type">${esc(i[3])}</span></article>`).join('') : '<p class="empty">Nothing matches that search. Try a shorter word, like "tea" or "egg".</p>';
}
q.addEventListener('input', renderMenu); renderMenu();

/* events */
const cats = ['All', ...new Set(EVENTS.map(e => e[4]))]; let evf = 'All';
const chips = $('#chips'), evGrid = $('#evGrid');
cats.forEach(c => { const b = document.createElement('button'); b.className = 'chip'; b.textContent = c; b.onclick = () => { evf = c; renderEv() }; chips.append(b) });
function renderEv() {
    [...chips.children].forEach(b => b.setAttribute('aria-pressed', b.textContent === evf));
    evGrid.innerHTML = EVENTS.filter(e => evf === 'All' || e[4] === evf).map(e => `<article class="ev rise"><span class="when">${e[1]}, ${e[2]}</span><h3>${esc(e[0])}</h3><p>${esc(e[3])}</p><span class="tag">${esc(e[4])}</span></article>`).join('');
    observe();
}
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target) } }), { threshold: .15 }) : null;
function observe() { document.querySelectorAll('.rise:not(.in)').forEach(el => io ? io.observe(el) : el.classList.add('in')) }
renderEv();

/* hours + open status (Manila time) */
function manilaNow() { const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()); const g = t => p.find(x => x.type === t).value; return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), min: (+g('hour') % 24) * 60 + +g('minute') } }
const now = manilaNow();
$('#hours').innerHTML = HOURS.map(h => `<li class="${h[1] === now.day ? 'today' : ''}"><span>${h[0]}</span><span>11:00 AM to 8:00 PM</span></li>`).join('');
const isOpen = now.min >= 660 && now.min < 1200;
$('#status').classList.toggle('open', isOpen);
$('#statusText').textContent = isOpen ? 'Open now until 8:00 PM' : 'Closed now. Opens daily at 11:00 AM';

/* copy address */
$('#copy').onclick = async () => {
    const text = 'Dice Tower Board Game Cafe, Golden Country Homes, Alanginan';
    const t = $('#toast'); let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true } catch (e) {
        try { const ta = document.createElement('textarea'); ta.value = text; document.body.append(ta); ta.select(); ok = document.execCommand('copy'); ta.remove() } catch (_) { }
    }
    t.textContent = ok ? 'Address copied' : 'Copy failed. Select the address instead.'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200);
};

/* form */
const form = $('#form'), dateEl = $('#date');
const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
dateEl.min = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
const rules = {
    name: v => v.trim().length < 2 ? 'Enter your name.' : '',
    contact: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || /^(\+63|0)9\d{9}$/.test(v.replace(/[\s-]/g, '')) ? '' : 'Enter a valid email or a mobile number like 0917 123 4567.',
    guests: v => (+v >= 1 && +v <= 12) ? '' : 'Tables seat 1 to 12 guests. For bigger groups, mention it in the notes.',
    date: v => !v ? 'Choose a date.' : v < dateEl.min ? 'Pick today or a later date.' : '',
    time: v => !v ? 'Choose an arrival time.' : (v < '11:00' || v > '19:30') ? 'We are open 11:00 AM to 8:00 PM. Arrive between 11:00 AM and 7:30 PM.' : ''
};
function check(id) { const el = $('#' + id), f = el.closest('.f'); const m = rules[id] ? rules[id](el.value) : ''; f.classList.toggle('bad', !!m); f.classList.toggle('ok', !m && !!el.value); el.setAttribute('aria-invalid', !!m); f.querySelector('.err').textContent = m; return !m }
Object.keys(rules).forEach(id => { const el = $('#' + id); el.addEventListener('blur', () => check(id)); el.addEventListener('input', () => { if (el.closest('.f').classList.contains('bad')) check(id) }) });
form.addEventListener('submit', e => {
    e.preventDefault();
    const results = Object.keys(rules).map(check);
    if (results.includes(false)) { const bad = form.querySelector('.bad input'); bad && bad.focus(); return }
    const d = $('#done');
    d.textContent = `Thanks, ${$('#name').value.trim()}. We received your ${$('#kind').value.toLowerCase()} for ${$('#date').value} at ${$('#time').value}. We will reply to ${$('#contact').value.trim()} to confirm.`;
    d.classList.add('show'); form.reset(); form.querySelectorAll('.ok,.bad').forEach(f => f.classList.remove('ok', 'bad')); $('#guests').value = 4; d.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

/* active nav link */
const links = [...document.querySelectorAll('nav a')];
if (io) {
    const so = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + x.target.id)) }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(a => { const s = $(a.getAttribute('href')); s && so.observe(s) })
}