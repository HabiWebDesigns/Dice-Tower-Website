(() => {
  const palette = ["#d8bd78", "#65a9ce", "#ba8db3", "#e47755", "#77ac78", "#d7a14b"];
  const grid = document.getElementById("playerGrid");
  const settings = document.getElementById("settingsDialog");
  const counterDialog = document.getElementById("counterDialog");
  const counterDetails = document.getElementById("counterDetails");
  const playersInput = document.getElementById("playerCount");
  const lifeInput = document.getElementById("startingLife");
  const storageKey = "diceTowerLifeCounter";
  let players = [];
  let startingLife = 40;
  let pressTimer;
  let longPress = false;
  let activePlayer = 0;

  function freshGame(count, life) {
    startingLife = life;
    players = Array.from({ length: count }, (_, i) => ({
      name: `Player ${i + 1}`, life, poison: 0, energy: 0
    }));
    save(); render();
  }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ players, startingLife })); } catch (_) { /* storage can be unavailable in private browsing */ }
  }

  function load() {
    try {
      const state = JSON.parse(localStorage.getItem(storageKey));
      if (state && Array.isArray(state.players) && state.players.length >= 2 && state.players.length <= 6) {
        players = state.players;
        startingLife = Number(state.startingLife) || 40;
        playersInput.value = players.length;
        lifeInput.value = startingLife;
        players.forEach(p => {
          p.poison = Number(p.poison) || 0; p.energy = Number(p.energy) || 0;
          delete p.experience;
          delete p.commander;
        });
        return true;
      }
    } catch (_) { /* start a new table when saved data is invalid */ }
    return false;
  }

  function defeatedReason(player) {
    if (player.life <= 0) return "Defeated";
    if (player.poison >= 10) return "10 poison";
    return "";
  }

  function makeButton(label, className, action, playerIndex, amount) {
    const button = document.createElement("button");
    button.type = "button"; button.className = className; button.textContent = label;
    button.dataset.action = action; button.dataset.player = playerIndex;
    if (amount !== undefined) button.dataset.amount = amount;
    return button;
  }

  function render() {
    grid.className = `player-grid players-${players.length}${players.length > 4 ? " many-players" : ""}`;
    grid.replaceChildren();
    players.forEach((player, i) => {
      const defeated = defeatedReason(player);
      const card = document.createElement("article");
      card.className = "player-card" + (defeated ? " is-defeated" : "");
      card.style.setProperty("--player", palette[i]);
      const heading = document.createElement("div"); heading.className = "player-heading";
      const name = document.createElement("input"); name.className = "player-name"; name.value = player.name;
      name.maxLength = 24; name.setAttribute("aria-label", `Player ${i + 1} name`); name.dataset.name = i;
      const tag = document.createElement("span"); tag.className = "player-tag"; tag.textContent = defeated || `Player ${i + 1}`;
      heading.append(name, tag);
      const lifeDisplay = document.createElement("div"); lifeDisplay.className = "life-display";
      const minus = makeButton("−", "life-button", "life", i, -1); minus.setAttribute("aria-label", `Lose life for ${player.name}`);
      const total = document.createElement("output"); total.className = "life-total"; total.textContent = player.life; total.setAttribute("aria-label", `${player.name}: ${player.life} life`); total.setAttribute("aria-live", "polite");
      const plus = makeButton("+", "life-button", "life", i, 1); plus.setAttribute("aria-label", `Gain life for ${player.name}`);
      lifeDisplay.append(minus, total, plus);
      const tools = document.createElement("div"); tools.className = "player-tools";
      const poison = makeButton(`☠ ${player.poison}`, "counter-tool", "open", i); poison.setAttribute("aria-label", `Poison counters for ${player.name}`);
      const other = makeButton("", "counter-tool energy-tool", "open", i); other.setAttribute("aria-label", `Energy counters for ${player.name}: ${player.energy}`);
      const energyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      energyIcon.setAttribute("class", "energy-symbol"); energyIcon.setAttribute("viewBox", "0 0 24 24"); energyIcon.setAttribute("aria-hidden", "true");
      energyIcon.innerHTML = '<path class="energy-token" d="M12 1.8 21 7v10l-9 5.2L3 17V7z"/><path class="energy-bolt" d="m13.4 4.9-6 8h4.2l-.9 6.2 6-8h-4.2z"/>';
      const energyCount = document.createElement("span"); energyCount.textContent = player.energy;
      other.append(energyIcon, energyCount);
      tools.append(poison, other);
      card.append(heading, lifeDisplay, tools); grid.appendChild(card);
    });
    document.getElementById("gameSummary").textContent = `${players.length} players · ${startingLife} starting life`;
  }

  function openCounters(index) {
    activePlayer = index;
    const player = players[index];
    document.getElementById("counterDialogKicker").textContent = player.name;
    document.getElementById("counterDialogTitle").textContent = "Counters";
    counterDetails.replaceChildren();
    [["Poison", "poison"], ["Energy", "energy"]].forEach(([label, key]) => {
      const row = document.createElement("div"); row.className = "extra-counter";
      const title = document.createElement("strong"); title.textContent = label;
      const value = document.createElement("output"); value.textContent = player[key];
      const controls = document.createElement("span"); controls.className = "mini-counter-controls";
      [-1, 1].forEach(amount => {
        const button = makeButton(amount < 0 ? "−" : "+", "", "counter", index, amount);
        button.dataset.key = key; button.disabled = amount < 0 && player[key] === 0; controls.appendChild(button);
      });
      row.append(title, value, controls); counterDetails.appendChild(row);
    });
    if (!counterDialog.open) counterDialog.showModal();
  }

  grid.addEventListener("pointerdown", event => {
    const button = event.target.closest('.life-button'); if (!button) return;
    longPress = false;
    pressTimer = window.setTimeout(() => {
      longPress = true;
      changeLife(button, Number(button.dataset.amount) * 9);
      window.setTimeout(() => { longPress = false; }, 700);
    }, 480);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(type => grid.addEventListener(type, () => window.clearTimeout(pressTimer)));
  function changeLife(button, amount) {
    players[Number(button.dataset.player)].life += amount; save(); render();
  }
  grid.addEventListener("click", event => {
    const target = event.target;
    const name = target.closest("input[data-name]");
    if (name) return;
    const button = target.closest("button[data-action]"); if (!button || button.disabled) return;
    const index = Number(button.dataset.player);
    if (button.dataset.action === "life") { if (longPress) { longPress = false; return; } changeLife(button, Number(button.dataset.amount)); }
    if (button.dataset.action === "open") openCounters(index);
  });
  grid.addEventListener("change", event => {
    const input = event.target.closest("input[data-name]"); if (!input) return;
    const player = players[Number(input.dataset.name)]; player.name = input.value.trim() || `Player ${Number(input.dataset.name) + 1}`; save(); render();
  });
  counterDetails.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]"); if (!button || button.disabled) return;
    const player = players[Number(button.dataset.player)]; const amount = Number(button.dataset.amount);
    if (button.dataset.action === "counter") player[button.dataset.key] = Math.max(0, player[button.dataset.key] + amount);
    save(); render(); openCounters(activePlayer);
  });
  document.getElementById("settingsButton").addEventListener("click", () => settings.showModal());
  document.getElementById("closeSettings").addEventListener("click", () => settings.close());
  document.getElementById("closeCounters").addEventListener("click", () => counterDialog.close());
  document.getElementById("newGameButton").addEventListener("click", () => settings.showModal());
  document.getElementById("settingsForm").addEventListener("submit", event => {
    event.preventDefault(); freshGame(Number(playersInput.value), Number(lifeInput.value)); settings.close();
  });
  document.getElementById("fullscreenButton").addEventListener("click", async () => {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); } catch (_) { /* fullscreen may be unavailable in an embedded browser */ }
  });

  if (!load()) { freshGame(4, 40); settings.showModal(); } else render();
})();
