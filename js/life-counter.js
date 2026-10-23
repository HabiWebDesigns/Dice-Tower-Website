(() => {
  const palette = ["#d8bd78", "#65a9ce", "#ba8db3", "#e47755", "#77ac78", "#d7a14b"];
  const grid = document.getElementById("playerGrid");
  const settings = document.getElementById("settingsDialog");
  const counterDialog = document.getElementById("counterDialog");
  const counterDetails = document.getElementById("counterDetails");
  const playersInput = document.getElementById("playerCount");
  const lifeInput = document.getElementById("startingLife");
  const storageKey = "diceTowerLifeCounter";
  const effectMedia = {
    death: [
      { type: "embed", src: "https://tenor.com/embed/15084980358892679827" },
      { type: "image", src: "https://media1.tenor.com/m/GOvZ08i0iicAAAAd/coffin-dance-coffin.gif" },
      { type: "image", src: "https://media.tenor.com/dPAQRrb9YcoAAAAj/dead-skeleton.gif" },
      { type: "image", src: "https://media1.tenor.com/m/yjXyDojiCAsAAAAd/jujutsu-jjk.gif" },
      { type: "embed", src: "https://tenor.com/embed/21591995" },
      { type: "embed", src: "https://tenor.com/embed/10262734429934951892" },
      { type: "embed", src: "https://tenor.com/embed/2539277877407045235" }
    ],
    commander: [
      { type: "image", src: "https://media1.tenor.com/m/0q87cz7-6wYAAAAd/fatality-mortal-kombat.gif" },
      { type: "embed", src: "https://tenor.com/embed/8170053925835606806" },
      { type: "embed", src: "https://tenor.com/embed/14561064389149752222" }
    ],
    poison: [
      { type: "embed", src: "https://tenor.com/embed/3566796335076748147" },
      { type: "image", src: "https://media1.tenor.com/m/qSk8cXwntt0AAAAd/toxic-britney-spears.gif" }
    ]
  };
  const announcementMedia = {
    winner: [
      { src: "https://media1.tenor.com/m/2LqoXEQNSJcAAAAd/michael-jordan-nba-championship.gif", embed: "https://tenor.com/embed/16343048" },
      { src: "https://tenor.com/embed/1819241332907680230", embed: "https://tenor.com/embed/1819241332907680230" }
    ],
    firstDamage: { src: "https://media1.tenor.com/m/bS-4zlpkcp0AAAAd/may-nangyayari-na.gif", embed: "https://tenor.com/embed/7867710270458851997" }
  };
  const usedEliminationEffects = new Set();
  let players = [];
  let startingLife = 40;
  let firstDamagePlayed = false;
  let winnerShown = false;
  let pressTimer;
  let longPress = false;
  let activePlayer = 0;
  const effectQueues = new Map();
  const runningEffects = new Set();
  let gameGeneration = 0;
  const announcementQueue = [];
  let announcementPlaying = false;

  function playNextAnnouncement() {
    if (announcementPlaying || !announcementQueue.length) return;
    announcementPlaying = true;
    const announcement = announcementQueue.shift();
    const mediaPool = announcementMedia[announcement.type];
    const media = Array.isArray(mediaPool)
      ? mediaPool[Math.floor(Math.random() * mediaPool.length)]
      : mediaPool;
    const layer = document.createElement("section");
    layer.className = "game-announcement";
    layer.setAttribute("role", "status");
    const panel = document.createElement("div");
    panel.className = "game-announcement-panel";
    const image = document.createElement("img");
    image.className = "game-announcement-media";
    image.src = media.src;
    image.alt = "";
    image.onerror = () => {
      const embed = document.createElement("iframe");
      embed.className = "game-announcement-media";
      embed.src = media.embed;
      embed.title = "Game announcement animation";
      embed.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
      image.replaceWith(embed);
    };
    const title = document.createElement("p");
    title.className = "game-announcement-title";
    title.textContent = announcement.type === "winner" ? `${announcement.name} wins!` : "First Blood";
    const actions = document.createElement("div");
    actions.className = "game-announcement-actions";
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "game-announcement-close";
    closeButton.textContent = announcement.type === "winner" ? "Close" : "Quick Exit";
    let closeTimer;
    const closeAnnouncement = () => {
      window.clearTimeout(closeTimer);
      layer.remove();
      announcementPlaying = false;
      playNextAnnouncement();
    };
    closeButton.addEventListener("click", closeAnnouncement);
    actions.appendChild(closeButton);
    panel.append(image, title, actions);
    layer.appendChild(panel);
    (counterDialog.open ? counterDialog : document.body).appendChild(layer);
    if (announcement.type !== "winner") {
      closeTimer = window.setTimeout(closeAnnouncement, 10000);
    }
  }

  function announceGameEvent(announcement) {
    announcementQueue.push(announcement);
    playNextAnnouncement();
  }

  function recordFirstDamage() {
    if (firstDamagePlayed) return;
    firstDamagePlayed = true;
    announceGameEvent({ type: "firstDamage" });
  }

  function playNextEffect(index) {
    const queue = effectQueues.get(index);
    if (!queue?.length) {
      effectQueues.delete(index);
      runningEffects.delete(index);
      return;
    }
    if (counterDialog.open) {
      runningEffects.add(index);
      window.setTimeout(() => playNextEffect(index), 250);
      return;
    }
    runningEffects.add(index);
    const card = grid.children[index];
    const effect = queue.shift();
    if (!card) {
      window.setTimeout(() => playNextEffect(index), 100);
      return;
    }

    const generation = gameGeneration;
    const overlay = createPlayerEffect(effect);
    card.appendChild(overlay);
    window.setTimeout(() => {
      overlay.remove();
      if (generation !== gameGeneration) return;
      playNextEffect(index);
    }, 10000);
  }

  function createPlayerEffect(effect) {
    const overlay = document.createElement("div");
    overlay.className = "player-effect";
    overlay.setAttribute("aria-hidden", "true");
    const content = document.createElement(effect.type === "embed" ? "iframe" : "img");
    content.className = "player-effect-media";
    if (effect.type === "embed") {
      content.src = effect.src;
      content.title = "Player event animation";
      content.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
      content.setAttribute("loading", "eager");
      content.setAttribute("frameborder", "0");
    } else {
      content.src = effect.src;
      content.alt = "";
    }
    overlay.appendChild(content);
    return overlay;
  }

  function choosePlayerEffect(category) {
    const pool = effectMedia[category];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function chooseEliminationEffect(category) {
    const allEffects = [...effectMedia.death, ...effectMedia.commander];
    const preferredEffects = effectMedia[category];
    let available = preferredEffects.filter(effect => !usedEliminationEffects.has(effect.src));
    if (!available.length) available = allEffects.filter(effect => !usedEliminationEffects.has(effect.src));
    if (!available.length) return null;
    const choice = available[Math.floor(Math.random() * available.length)];
    usedEliminationEffects.add(choice.src);
    return choice;
  }

  function queuePlayerEffect(index, category) {
    const pool = effectMedia[category];
    if (!pool?.length) return;
    const choice = choosePlayerEffect(category);
    const queue = effectQueues.get(index) || [];
    queue.push(choice);
    effectQueues.set(index, queue);
    if (!runningEffects.has(index)) playNextEffect(index);
  }

  function freshGame(count, life) {
    gameGeneration += 1;
    effectQueues.clear();
    runningEffects.clear();
    usedEliminationEffects.clear();
    startingLife = life;
    firstDamagePlayed = false;
    winnerShown = false;
    players = Array.from({ length: count }, (_, i) => ({
      name: `Player ${i + 1}`, life, poison: 0,
      commanderDamage: Array(count).fill(0)
    }));
    save(); render();
  }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ players, startingLife, firstDamagePlayed, winnerShown, usedEliminationEffects: [...usedEliminationEffects] })); } catch (_) { /* storage can be unavailable in private browsing */ }
  }

  function load() {
    try {
      const state = JSON.parse(localStorage.getItem(storageKey));
      if (state && Array.isArray(state.players) && state.players.length >= 2 && state.players.length <= 6) {
        players = state.players;
        startingLife = Number(state.startingLife) || 40;
        playersInput.value = players.length;
        lifeInput.value = startingLife;
        players.forEach((p, playerIndex) => {
          p.poison = Number(p.poison) || 0;
          delete p.energy;
          const savedDamage = Array.isArray(p.commanderDamage) ? p.commanderDamage : [];
          p.commanderDamage = Array.from({ length: players.length }, (_, sourceIndex) =>
            sourceIndex === playerIndex ? 0 : Math.max(0, Number(savedDamage[sourceIndex]) || 0));
          delete p.experience;
          delete p.commander;
        });
        firstDamagePlayed = Boolean(state.firstDamagePlayed) || players.some(player =>
          player.life < startingLife || player.commanderDamage.some(damage => damage > 0));
        usedEliminationEffects.clear();
        if (Array.isArray(state.usedEliminationEffects)) {
          state.usedEliminationEffects.forEach(effect => usedEliminationEffects.add(effect));
        }
        players.forEach(player => {
          if (player.eliminationGif) usedEliminationEffects.add(player.eliminationGif);
        });
        winnerShown = typeof state.winnerShown === "boolean"
          ? state.winnerShown
          : players.filter(player => !defeatedReason(player)).length <= 1;
        return true;
      }
    } catch (_) { /* start a new table when saved data is invalid */ }
    return false;
  }

  function defeatedReason(player) {
    if (player.life <= 0) return "Defeated";
    if (player.poison >= 10) return "10 poison";
    if (player.commanderDamage.some(damage => damage >= 21)) return "21 commander";
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
      const commander = makeButton("Commander", "counter-tool commander-tool", "open", i);
      commander.setAttribute("aria-label", `Commander damage for ${player.name}`);
      tools.append(poison, commander);
      card.append(heading, lifeDisplay, tools); grid.appendChild(card);
      let persistentEffect = player.eliminationGif
        ? [...effectMedia.death, ...effectMedia.commander].find(effect => effect.src === player.eliminationGif)
        : null;
      if (defeated && !persistentEffect && !player.eliminationGif) {
        const category = defeated === "21 commander" ? "commander" : "death";
        persistentEffect = chooseEliminationEffect(category);
        if (persistentEffect) {
          player.eliminationGif = persistentEffect.src;
          save();
        }
      }
      if (persistentEffect) card.appendChild(createPlayerEffect(persistentEffect));
    });
    document.getElementById("gameSummary").textContent = `${players.length} players · ${startingLife} starting life`;
    checkForWinner();
  }

  function checkForWinner() {
    const remainingPlayers = players.filter(player => !defeatedReason(player));
    if (winnerShown || remainingPlayers.length !== 1) return;
    winnerShown = true;
    save();
    announceGameEvent({ type: "winner", name: remainingPlayers[0].name });
  }

  function openCounters(index) {
    activePlayer = index;
    const player = players[index];
    document.getElementById("counterDialogKicker").textContent = player.name;
    document.getElementById("counterDialogTitle").textContent = "Counters & Commander Damage";
    counterDetails.replaceChildren();
    [["Poison", "poison"]].forEach(([label, key]) => {
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
    const commanderHeading = document.createElement("h3");
    commanderHeading.className = "counter-group-title";
    commanderHeading.textContent = "Commander damage taken";
    counterDetails.appendChild(commanderHeading);
    players.forEach((opponent, sourceIndex) => {
      if (sourceIndex === index) return;
      const row = document.createElement("div"); row.className = "extra-counter commander-counter";
      const title = document.createElement("strong"); title.textContent = `From ${opponent.name}`;
      const value = document.createElement("output"); value.textContent = player.commanderDamage[sourceIndex];
      const controls = document.createElement("span"); controls.className = "mini-counter-controls";
      [-1, 1].forEach(amount => {
        const button = makeButton(amount < 0 ? "−" : "+", "", "counter", index, amount);
        button.dataset.key = `commanderDamage:${sourceIndex}`;
        button.setAttribute("aria-label", `${amount < 0 ? "Remove commander damage from" : "Add commander damage from"} ${opponent.name}`);
        button.disabled = amount < 0 && player.commanderDamage[sourceIndex] === 0;
        controls.appendChild(button);
      });
      row.append(title, value, controls); counterDetails.appendChild(row);
    });
    const rule = document.createElement("p");
    rule.className = "commander-rule";
    rule.textContent = "21 damage from one opponent’s commander defeats a player.";
    counterDetails.appendChild(rule);
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
    const player = players[Number(button.dataset.player)];
    if (amount < 0 && !defeatedReason(player)) recordFirstDamage();
    player.life += amount; save(); render();
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
    let poisonAdded = false;
    let commanderDamageAdded = false;
    if (button.dataset.action === "counter") {
      if (button.dataset.key.startsWith("commanderDamage:")) {
        const sourceIndex = Number(button.dataset.key.split(":")[1]);
        commanderDamageAdded = amount > 0 && !defeatedReason(player);
        player.commanderDamage[sourceIndex] = Math.max(0, player.commanderDamage[sourceIndex] + amount);
      } else {
        poisonAdded = button.dataset.key === "poison" && amount > 0;
        player[button.dataset.key] = Math.max(0, player[button.dataset.key] + amount);
      }
    }
    if (commanderDamageAdded) recordFirstDamage();
    save(); render(); openCounters(activePlayer);
    if (poisonAdded) queuePlayerEffect(Number(button.dataset.player), "poison");
  });
  document.getElementById("settingsButton").addEventListener("click", () => settings.showModal());
  document.getElementById("closeSettings").addEventListener("click", () => settings.close());
  document.getElementById("closeCounters").addEventListener("click", () => counterDialog.close());
  counterDialog.addEventListener("close", () => {
    const announcement = counterDialog.querySelector(".game-announcement");
    if (announcement) document.body.appendChild(announcement);
  });
  document.getElementById("newGameButton").addEventListener("click", () => settings.showModal());
  document.getElementById("settingsForm").addEventListener("submit", event => {
    event.preventDefault(); freshGame(Number(playersInput.value), Number(lifeInput.value)); settings.close();
  });
  document.getElementById("fullscreenButton").addEventListener("click", async () => {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); } catch (_) { /* fullscreen may be unavailable in an embedded browser */ }
  });

  if (!load()) { freshGame(4, 40); settings.showModal(); } else render();
})();
