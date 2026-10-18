/* ===== Dice Tower: js/dice.js =====
   The clickable d20 on the main page. Tap the die to roll a number from 1 to 20. */
(function () {
  const btn = document.getElementById("d20Btn");
  if (!btn) return;
  const numEl = document.getElementById("d20Num");
  const result = document.getElementById("d20Result");
  const history = document.getElementById("d20History");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ROLL_MS = reduceMotion ? 500 : 1300;   // how long the die "tumbles"
  const rolls = [];
  let rolling = false;

  /* A fair 1 to 20 roll (no modulo bias). */
  function d20() {
    if (window.crypto && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      do { crypto.getRandomValues(a); } while (a[0] >= 4294967280); // 4294967280 = 20 x 214748364
      return (a[0] % 20) + 1;
    }
    return Math.floor(Math.random() * 20) + 1;
  }

  function message(n) {
    if (n === 20) return "Natural 20! Critical hit!";
    if (n === 1) return "Natural 1. Critical fail. Coffee will fix it.";
    if (n >= 15) return "Great roll. The table is yours.";
    if (n >= 8) return "Solid roll. Keep playing.";
    return "Rough roll. Reroll, the dice owe you.";
  }

  function roll() {
    if (rolling) return;
    rolling = true;
    btn.disabled = true;
    btn.classList.remove("crit", "fail");
    btn.classList.add("rolling");
    result.textContent = "Rolling...";
    // Flicker random numbers while the die tumbles.
    const flicker = setInterval(() => { numEl.textContent = d20(); }, 70);
    setTimeout(() => {
      clearInterval(flicker);
      const n = d20();
      numEl.textContent = n;
      result.textContent = "You rolled a " + n + ". " + message(n);
      btn.classList.remove("rolling");
      if (n === 20) btn.classList.add("crit");
      if (n === 1) btn.classList.add("fail");
      rolls.unshift(n);
      if (rolls.length > 6) rolls.pop();
      history.innerHTML = "";
      rolls.forEach(r => { const li = document.createElement("li"); li.textContent = r; history.appendChild(li); });
      btn.disabled = false;
      rolling = false;
      btn.focus();
    }, ROLL_MS);
  }

  btn.addEventListener("click", roll);
})();
