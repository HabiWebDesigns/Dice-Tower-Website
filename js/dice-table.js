(() => {
  const picker = document.querySelector(".die-picker");
  const mat = document.getElementById("feltMat");
  const stage = document.getElementById("dieStage");
  const result = document.getElementById("rollResult");
  const rollButton = document.getElementById("rollButton");
  const history = document.getElementById("rollHistory");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let sides = 20;
  let rolling = false;
  let rolls = [];
  const diePalettes = {
    6: ["#fff0c5", "#d9ad68", "#79502f"],
    8: ["#a6e7a6", "#328d61", "#15453d"],
    10: ["#a5e5ec", "#388bae", "#1c3e68"],
    12: ["#d5b8f4", "#8055af", "#3a285e"],
    20: ["#ff9a64", "#c34432", "#612333"],
    100: ["#ffd375", "#db7735", "#693429"]
  };

  const dieForms = {
    6: {
      outline: "M50 5 88 27v46L50 95 12 73V27Z",
      faces: '<path class="facet facet-a" d="M50 5 88 27 50 50Z"/><path class="facet facet-b" d="m88 27v46L50 95V50Z"/><path class="facet facet-c" d="M50 5 50 50 12 73V27Z"/><path class="facet facet-d" d="m12 73 38-23v45Z"/>',
      edges: "M50 5v45m38-23L50 50 12 27m76 46L50 50 12 73"
    },
    8: {
      outline: "M50 5 91 28 76 74 50 95 24 74 9 28Z",
      faces: '<path class="facet facet-a" d="M50 5 70 39 50 50 30 39Z"/><path class="facet facet-b" d="m50 5 41 23-21 11Z"/><path class="facet facet-c" d="m91 28-15 46-26-24 20-11Z"/><path class="facet facet-d" d="m76 74-26 21V50Z"/><path class="facet facet-a" d="M50 95 24 74l26-24Z"/><path class="facet facet-c" d="M24 74 9 28l21 11 20 11Z"/>',
      edges: "M50 5 50 50 91 28M9 28l41 22 41-22M24 74l26-24 26 24M50 50v45"
    },
    10: {
      outline: "M50 4 77 15 91 37 77 55 50 96 23 85 9 63 23 45Z",
      faces: '<path class="facet facet-a" d="M50 4 77 15 50 33Z"/><path class="facet facet-b" d="m77 15 14 22-41-4Z"/><path class="facet facet-c" d="M91 37 77 55 50 33Z"/><path class="facet facet-a" d="M77 55 50 96V61Z"/><path class="facet facet-b" d="M50 96 23 85 50 61Z"/><path class="facet facet-c" d="M23 85 9 63l41-2Z"/><path class="facet facet-a" d="M9 63 23 45 50 61Z"/><path class="facet facet-b" d="M23 45 9 63 23 85 50 61 77 55 91 37 77 15 50 33Z"/>',
      edges: "M50 4 50 33 91 37m-82 26 41-2 27-2m-54 26 27-24 27-6M50 33l-27 12m54 10L50 33"
    },
    12: {
      outline: "M50 4 73 10 89 28 89 56 74 82 50 96 26 82 11 56 11 28 27 10Z",
      faces: '<path class="facet facet-a" d="M50 4 67 27 50 43 33 27Z"/><path class="facet facet-b" d="m50 4 23 6-6 17Z"/><path class="facet facet-c" d="m73 10 16 18-22-1Z"/><path class="facet facet-a" d="m89 28v28L68 43Z"/><path class="facet facet-b" d="m89 56-15 26-6-39Z"/><path class="facet facet-c" d="M74 82 50 96V67Z"/><path class="facet facet-a" d="M50 96 26 82l18-39 6 24Z"/><path class="facet facet-b" d="M26 82 11 56l33-13Z"/><path class="facet facet-c" d="M11 56V28l23 15Z"/><path class="facet facet-a" d="M11 28 27 10l6 17Z"/><path class="facet facet-b" d="m27 10 23-6-17 23Z"/>',
      edges: "M50 4v39l-6 24m6-24 24 39M11 28l23 15 16-39m39 24L68 43 50 4m-39 52 33-13 24 39m21-11L68 43"
    },
    20: {
      outline: "M50 3 73 10 90 28 96 50 85 74 67 90 50 97 33 90 15 74 4 50 10 28 27 10Z",
      faces: '<path class="facet facet-a" d="M50 3 73 10 58 31Z"/><path class="facet facet-b" d="m73 10 17 18-32 3Z"/><path class="facet facet-c" d="m90 28 6 22-38-19Z"/><path class="facet facet-a" d="m96 50-11 24-27-43Z"/><path class="facet facet-b" d="M85 74 67 90 58 31Z"/><path class="facet facet-c" d="m67 90-17 7 8-66Z"/><path class="facet facet-a" d="m50 97-17-7 25-59Z"/><path class="facet facet-b" d="M33 90 15 74l43-43Z"/><path class="facet facet-c" d="M15 74 4 50l54-19Z"/><path class="facet facet-a" d="M4 50 10 28l48 3Z"/><path class="facet facet-b" d="M10 28 27 10l31 21Z"/><path class="facet facet-c" d="m27 10 23-7 8 28Z"/>',
      edges: "M50 3 58 31 73 10m17 18-32 3 38 19m0 0-38-19 27 43M85 74 58 31 67 90m0 0-9-59-16 35M33 90l25-59-43 43M4 50l54-19-48-3m17-18 31 21"
    }
  };
  const sixPips = {
    1: [[68, 52]],
    2: [[60, 40], [77, 66]],
    3: [[60, 40], [68, 52], [77, 66]],
    4: [[60, 40], [77, 40], [60, 66], [77, 66]],
    5: [[60, 40], [77, 40], [68, 52], [60, 66], [77, 66]],
    6: [[60, 38], [77, 38], [60, 52], [77, 52], [60, 66], [77, 66]]
  };

  function rollValue(max) {
    if (window.crypto && window.crypto.getRandomValues) {
      const span = 0x100000000;
      const limit = span - span % max;
      const values = new Uint32Array(1);
      do { crypto.getRandomValues(values); } while (values[0] >= limit);
      return values[0] % max + 1;
    }
    return Math.floor(Math.random() * max) + 1;
  }

  function drawDie(value = sides) {
    const face = sides === 100 && value === sides ? "00" : String(value);
    const form = dieForms[sides === 100 ? 10 : sides];
    const palette = diePalettes[sides];
    const compact = face.length > 2 ? " die-number--compact" : "";
    const faceMark = sides === 6
      ? sixPips[value].map(([x, y]) => `<circle class="die-pip" cx="${x}" cy="${y}" r="3.2"/>`).join("")
      : `<text class="die-number${compact}" x="50" y="51">${face}</text>`;
    stage.innerHTML = `<svg class="die-svg die-svg--d${sides}" viewBox="0 0 100 100" role="img" aria-label="D${sides} showing ${face}" style="--die-light:${palette[0]};--die-mid:${palette[1]};--die-dark:${palette[2]}"><defs><linearGradient id="dieGradient" x1="18%" y1="8%" x2="82%" y2="100%"><stop class="gradient-light" offset="0%"/><stop class="gradient-mid" offset="52%"/><stop class="gradient-dark" offset="100%"/></linearGradient></defs><path class="die-shell" d="${form.outline}"/><g class="die-facets">${form.faces}</g><path class="die-facets-edge" d="${form.edges}"/><path class="die-outline" d="${form.outline}"/><path class="die-glint" d="M24 20 39 11"/>${faceMark}</svg>`;
  }

  function setDie(nextSides) {
    sides = nextSides;
    picker.querySelectorAll(".die-choice").forEach(button => {
      const selected = Number(button.dataset.sides) === sides;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    rollButton.textContent = `Roll D${sides}`;
    result.textContent = `Ready to roll a D${sides}`;
    drawDie(sides);
  }

  picker.addEventListener("click", event => {
    const button = event.target.closest("button[data-sides]");
    if (button && !rolling) setDie(Number(button.dataset.sides));
  });

  rollButton.addEventListener("click", () => {
    if (rolling) return;
    rolling = true;
    rollButton.disabled = true;
    mat.classList.remove("dice-rolling");
    void mat.offsetWidth;
    mat.classList.add("dice-rolling");
    result.textContent = `Rolling D${sides}…`;
    const duration = reduceMotion ? 350 : 1300;
    const flicker = window.setInterval(() => drawDie(rollValue(sides)), 75);
    window.setTimeout(() => {
      window.clearInterval(flicker);
      const value = rollValue(sides);
      drawDie(value);
      result.textContent = `D${sides}: ${value}`;
      rolls.unshift({ sides, value });
      rolls = rolls.slice(0, 8);
      history.replaceChildren(...rolls.map(roll => {
        const item = document.createElement("li");
        item.textContent = `D${roll.sides} · ${roll.value}`;
        return item;
      }));
      mat.classList.remove("dice-rolling");
      rollButton.disabled = false;
      rolling = false;
      rollButton.focus();
    }, duration);
  });

  setDie(20);
})();
