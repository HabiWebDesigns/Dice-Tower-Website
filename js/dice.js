/* ===== Dice Tower: js/dice.js =====
   Shared roll behavior for the D20 section and the floating D20 widget. */
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ROLL_MS = reduceMotion ? 500 : 1300;   // how long the die "tumbles"

  /* A fair 1 to 20 roll (no modulo bias). */
  function d20() {
    if (window.crypto && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      do { crypto.getRandomValues(a); } while (a[0] >= 4294967280); // 4294967280 = 20 x 214748364
      return (a[0] % 20) + 1;
    }
    return Math.floor(Math.random() * 20) + 1;
  }

  function resultRoll() {
    if (window.crypto && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      do { crypto.getRandomValues(a); } while (a[0] >= 4294967280); // divisible by 20 for an exact 5% chance
      if (a[0] % 20 === 0) return 67;
    } else if (Math.random() < 0.05) {
      return 67;
    }
    return d20();
  }

  let sixSevenTimer;
  function showSixSevenGifs() {
    document.getElementById("sixSevenOverlay")?.remove();
    window.clearTimeout(sixSevenTimer);

    const overlay = document.createElement("div");
    overlay.id = "sixSevenOverlay";
    overlay.className = "six-seven-overlay";
    overlay.setAttribute("aria-hidden", "true");
    const gifs = [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeW5zejVuejlsbW90emNrdDRxZzFudmcxcXM3d3BpbTdybzh0ZzlxdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/AINeC40MaJRtVw4hZ3/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeW5zejVuejlsbW90emNrdDRxZzFudmcxcXM3d3BpbTdybzh0ZzlxdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/D2jYcCdYiiXriQdKcD/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeW5zejVuejlsbW90emNrdDRxZzFudmcxcXM3d3BpbTdybzh0ZzlxdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/8rN9VXNb7dfU792YQt/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeW5zejVuejlsbW90emNrdDRxZzFudmcxcXM3d3BpbTdybzh0ZzlxdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/TpvnqBFOE0tVrnGU1h/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeW5zejVuejlsbW90emNrdDRxZzFudmcxcXM3d3BpbTdybzh0ZzlxdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/6LkqKOn3RSfvBB5vSu/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeW5zejVuejlsbW90emNrdDRxZzFudmcxcXM3d3BpbTdybzh0ZzlxdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/V5huUSKSZEKcesHkXr/giphy.gif"
    ];

    gifs.forEach(gif => {
      const image = document.createElement("img");
      image.className = "six-seven-gif";
      image.src = gif;
      image.alt = "";
      image.draggable = false;
      overlay.appendChild(image);
    });

    document.body.appendChild(overlay);
    sixSevenTimer = window.setTimeout(() => overlay.remove(), 10000);
  }

  function message(n) {
    if (n === 67) return "SIIIIIXXXXXX SEEEEEEEEVVVVVVEEEEEEENNN";
    if (n === 20) return "Natural 20! Critical hit!";
    if (n === 1) return "Natural 1. Critical fail. Coffee will fix it.";
    if (n >= 15) return "Great roll. The table is yours.";
    if (n >= 8) return "Solid roll. Keep playing.";
    return "Rough roll. Reroll, the dice owe you.";
  }

  function playPageIntro() {
    const intro = document.getElementById("pageIntro");
    if (!intro) return;

    const die = document.getElementById("introDie");
    const cards = document.getElementById("introCards");
    const status = document.getElementById("introMessage");
    const skip = document.getElementById("introSkip");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rollDuration = reduceMotion ? 500 : 1200;
    const cardsDuration = reduceMotion ? 650 : 1600;
    let finished = false;
    let rollTimer;
    let finishTimer;

    function finish() {
      if (finished) return;
      finished = true;
      window.clearTimeout(rollTimer);
      window.clearTimeout(finishTimer);
      intro.classList.add("is-finished");
      window.setTimeout(() => {
        intro.remove();
        document.documentElement.classList.remove("intro-active");
      }, reduceMotion ? 50 : 500);
    }

    skip.addEventListener("click", finish);
    die.classList.add("is-rolling");
    rollTimer = window.setTimeout(() => {
      if (finished) return;
      die.classList.remove("is-rolling");
      die.classList.add("is-landed");
      cards.classList.add("is-falling");
      status.textContent = "Natural 20! Here come the cards.";
    }, rollDuration);
    finishTimer = window.setTimeout(finish, rollDuration + cardsDuration);
  }

  function bindRoller(btn, numEl, result, history, bubble, closeBubble) {
    if (!btn) return;
    let rolling = false;
    const rolls = [];

    if (closeBubble && bubble) {
      closeBubble.addEventListener("click", () => { bubble.hidden = true; });
    }

    btn.addEventListener("click", () => {
      if (rolling) return;
      rolling = true;
      if (bubble) bubble.hidden = false;
      btn.disabled = true;
      btn.classList.remove("crit", "fail");
      btn.classList.add("rolling");
      result.textContent = "Rolling...";
      const flicker = setInterval(() => { numEl.textContent = d20(); }, 70);
      setTimeout(() => {
        clearInterval(flicker);
        const n = resultRoll();
        numEl.textContent = n;
        result.textContent = "You rolled a " + n + "! " + message(n);
        if (n === 67) showSixSevenGifs();
        btn.classList.remove("rolling");
        if (n === 20) btn.classList.add("crit");
        if (n === 1) btn.classList.add("fail");
        if (history) {
          rolls.unshift(n);
          if (rolls.length > 6) rolls.pop();
          history.innerHTML = "";
          rolls.forEach(r => { const li = document.createElement("li"); li.textContent = r; history.appendChild(li); });
        }
        btn.disabled = false;
        rolling = false;
        btn.focus();
      }, ROLL_MS);
    });
  }

  bindRoller(
    document.getElementById("d20Btn"),
    document.getElementById("d20Num"),
    document.getElementById("d20Result"),
    document.getElementById("d20History"),
    null,
    null
  );
  bindRoller(
    document.getElementById("d20WidgetBtn"),
    document.getElementById("d20WidgetNum"),
    document.getElementById("d20WidgetText"),
    null,
    document.getElementById("d20WidgetBubble"),
    document.getElementById("d20WidgetClose")
  );
  playPageIntro();
})();
