/* Commander life counter and page navigation. */
(function () {
  const colors = [
    { name: "White", value: "#d8bd78", text: "#2d2416" },
    { name: "Blue", value: "#4d9bcb", text: "#102333" },
    { name: "Black", value: "#8b7d9d", text: "#201a28" },
    { name: "Red", value: "#e16c4f", text: "#35150f" },
    { name: "Green", value: "#6ca56c", text: "#122514" },
    { name: "Gold", value: "#d89a36", text: "#31200b" },
    { name: "Teal", value: "#45a69a", text: "#102521" },
    { name: "Violet", value: "#a477c7", text: "#26172f" },
    { name: "Rose", value: "#d77291", text: "#32151f" },
    { name: "Silver", value: "#9ba9b2", text: "#1b252b" }
  ];
  const grid = document.getElementById("playerGrid");
  const countSelect = document.getElementById("playerCount");
  const setup = document.getElementById("gameSetup");
  const status = document.getElementById("gameStatus");
  const scene = document.getElementById("tableScene");
  let players = [];
  let changed = false;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function newGame(count) {
    players = Array.from({ length: count }, (_, index) => ({
      name: "Player " + (index + 1),
      life: 40,
      poison: 0,
      commanderDamage: Array(count).fill(0)
    }));
    changed = false;
    render();
  }

  function control(label, action, amount, disabled) {
    const button = make("button", "counter-button", label);
    button.type = "button";
    button.dataset.action = action;
    if (amount !== undefined) button.dataset.amount = amount;
    button.setAttribute("aria-label", label);
    if (disabled) button.disabled = true;
    return button;
  }

  function defeatedReason(player) {
    if (player.life <= 0) return "Life is 0 or less";
    if (player.poison >= 10) return "10 poison counters";
    const source = player.commanderDamage.findIndex(amount => amount >= 21);
    if (source !== -1) return "21 commander damage from " + players[source].name;
    return "";
  }

  function commanderPanel(target, targetIndex) {
    const details = make("details", "commander-details");
    const summary = make("summary", "", "Commander damage");
    details.appendChild(summary);
    const list = make("ul", "damage-list");
    players.forEach((source, sourceIndex) => {
      if (sourceIndex === targetIndex) return;
      const item = make("li", "damage-row");
      const sourceLabel = make("span", "damage-source", source.name);
      sourceLabel.dataset.opponent = sourceIndex;
      sourceLabel.style.setProperty("--player-color", colors[sourceIndex].value);
      const value = make("span", "damage-value", String(target.commanderDamage[sourceIndex]));
      value.setAttribute("aria-live", "polite");
      const controls = make("span", "mini-controls");
      const minus = control("−", "commander", -1, target.commanderDamage[sourceIndex] === 0);
      minus.dataset.target = targetIndex;
      minus.dataset.source = sourceIndex;
      minus.setAttribute("aria-label", "Remove one commander damage from " + source.name);
      const plus = control("+", "commander", 1);
      plus.dataset.target = targetIndex;
      plus.dataset.source = sourceIndex;
      plus.setAttribute("aria-label", "Add one commander damage from " + source.name);
      controls.append(minus, value, plus);
      item.append(sourceLabel, controls);
      list.appendChild(item);
    });
    details.appendChild(list);
    return details;
  }

  function render() {
    const openCommanderPanels = new Set(
      Array.from(grid.querySelectorAll(".player-card"))
        .filter(card => card.querySelector(".commander-details")?.open)
        .map(card => Number(card.closest(".player-seat").dataset.player))
    );
    grid.replaceChildren();
    scene.style.setProperty("--seat-count", players.length);
    scene.style.setProperty("--seat-width", Math.max(176, 245 - players.length * 7) + "px");
    const tableWidths = [0, 0, 340, 390, 440, 490, 520, 560, 590, 620, 650];
    const tableHeights = [0, 0, 320, 330, 340, 350, 360, 370, 380, 390, 400];
    scene.style.setProperty("--table-width", tableWidths[players.length] + "px");
    scene.style.setProperty("--table-height", tableHeights[players.length] + "px");
    const sideCount = players.length === 3 ? 1 : players.length >= 5 ? (players.length % 2 === 0 ? 2 : 1) : 0;
    const rowCount = Math.floor((players.length - sideCount) / 2);
    const seatPositions = [];
    const addRowSeats = (indexes, row) => {
      const firstColumn = 5 - indexes.length;
      indexes.forEach((playerIndex, slot) => {
        seatPositions[playerIndex] = { row, column: firstColumn + slot * 2 };
      });
    };
    addRowSeats(Array.from({ length: rowCount }, (_, index) => index), 1);
    for (let side = 0; side < sideCount; side++) {
      seatPositions[rowCount + side] = { row: 2, column: side === 0 ? 1 : 7 };
    }
    addRowSeats(Array.from({ length: rowCount }, (_, index) => rowCount + sideCount + index), 3);
    players.forEach((player, index) => {
      const color = colors[index];
      const defeated = defeatedReason(player);
      const seat = make("div", "player-seat");
      seat.dataset.player = index;
      seat.style.gridRow = String(seatPositions[index].row);
      seat.style.gridColumn = seatPositions[index].column + " / span 2";
      const card = make("article", "player-card" + (defeated ? " is-defeated" : ""));
      card.dataset.player = index;
      card.style.setProperty("--player-color", color.value);
      card.style.setProperty("--player-text", color.text);
      card.setAttribute("aria-label", player.name + (defeated ? ", defeated: " + defeated : ""));

      const heading = make("div", "player-heading");
      const swatch = make("span", "player-swatch");
      swatch.setAttribute("aria-hidden", "true");
      const name = make("input", "player-name");
      name.type = "text";
      name.maxLength = 18;
      name.value = player.name;
      name.dataset.name = index;
      name.setAttribute("aria-label", "Player " + (index + 1) + " name");
      heading.append(swatch, name);

      const life = make("div", "life-total", String(player.life));
      life.setAttribute("aria-label", player.name + " life total");
      life.setAttribute("aria-live", "polite");
      const lifeControls = make("div", "life-controls");
      [["−5", -5], ["−1", -1], ["+1", 1], ["+5", 5]].forEach(([label, amount]) => {
        const button = control(label, "life", amount);
        button.dataset.player = index;
        button.setAttribute("aria-label", (amount < 0 ? "Lose " + Math.abs(amount) : "Gain " + amount) + " life for " + player.name);
        lifeControls.appendChild(button);
      });

      const poison = make("section", "counter-panel poison-panel");
      poison.setAttribute("aria-label", "Poison counters");
      const poisonHead = make("div", "counter-heading");
      const poisonTotal = make("span", "counter-total", String(player.poison));
      poisonTotal.setAttribute("aria-live", "polite");
      poisonHead.append(make("span", "counter-title", "Poison"), poisonTotal);
      const poisonControls = make("div", "mini-controls");
      const poisonDown = control("−", "poison", -1, player.poison === 0);
      poisonDown.dataset.player = index;
      poisonDown.setAttribute("aria-label", "Remove one poison counter from " + player.name);
      const poisonUp = control("+", "poison", 1);
      poisonUp.dataset.player = index;
      poisonUp.setAttribute("aria-label", "Add one poison counter to " + player.name);
      poisonControls.append(poisonDown, poisonUp);
      poisonHead.appendChild(poisonControls);
      poison.appendChild(poisonHead);

      const cardTop = make("div", "life-card-top");
      cardTop.append(heading, life, lifeControls);
      card.appendChild(cardTop);
      const counters = make("div", "player-counters");
      counters.appendChild(poison);
      counters.appendChild(commanderPanel(player, index));
      card.appendChild(counters);
      if (defeated) card.appendChild(make("p", "defeated-note", "Defeated · " + defeated));
      seat.appendChild(card);
      grid.appendChild(seat);
    });
    openCommanderPanels.forEach(index => {
      grid.querySelector('.player-seat[data-player="' + index + '"] .commander-details')?.setAttribute("open", "");
    });
    status.textContent = players.length + (players.length === 1 ? " player" : " players") + " · 40 starting life";
  }

  setup.addEventListener("submit", event => {
    event.preventDefault();
    if (changed && !window.confirm("Start a new game? Current life and counters will be cleared.")) return;
    newGame(Number(countSelect.value));
  });

  grid.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled) return;
    const focusData = { action: button.dataset.action, amount: button.dataset.amount, player: button.dataset.player, target: button.dataset.target, source: button.dataset.source };
    const amount = Number(button.dataset.amount);
    if (button.dataset.action === "life") players[Number(button.dataset.player)].life += amount;
    if (button.dataset.action === "poison") {
      const player = players[Number(button.dataset.player)];
      player.poison = Math.max(0, player.poison + amount);
    }
    if (button.dataset.action === "commander") {
      const target = players[Number(button.dataset.target)];
      const sourceIndex = Number(button.dataset.source);
      target.commanderDamage[sourceIndex] = Math.max(0, target.commanderDamage[sourceIndex] + amount);
    }
    changed = true;
    render();
    const nextButton = Array.from(grid.querySelectorAll("button[data-action]")).find(candidate =>
      candidate.dataset.action === focusData.action && candidate.dataset.amount === focusData.amount &&
      candidate.dataset.player === focusData.player && candidate.dataset.target === focusData.target && candidate.dataset.source === focusData.source
    );
    if (nextButton) nextButton.focus();
  });

  grid.addEventListener("input", event => {
    const input = event.target.closest("input[data-name]");
    if (!input) return;
    const playerIndex = Number(input.dataset.name);
    players[playerIndex].name = input.value.trim() || "Player " + (playerIndex + 1);
    changed = true;
    grid.querySelectorAll('[data-opponent="' + playerIndex + '"]').forEach(label => { label.textContent = players[playerIndex].name; });
    grid.querySelectorAll('button[data-source="' + playerIndex + '"]').forEach(button => {
      const action = button.dataset.amount === "1" ? "Add one" : "Remove one";
      button.setAttribute("aria-label", action + " commander damage from " + players[playerIndex].name);
    });
  });

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") !== "true";
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("open", open);
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    nav.classList.remove("open");
  }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
      nav.classList.remove("open");
    }
  });

  newGame(Number(countSelect.value));
})();
