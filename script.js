// Edit these to match your server.
const CONFIG = {
  ip: "play.selyxcraft.net",
  bedrockPort: 19132,
  discord: "https://discord.gg/nEG4y3jYS",
  // Server Settings > Widget > enable "Server Widget", then copy the Server ID here.
  discordServerId: "1487776533203517460",
  store: "https://your-store.tebex.io",
  staff: [
    { name: "Opulince", role: "Owner & Founder", owner: true },
    { name: "Rubix_cube_xd", role: "Co-Founder" },
    { name: "covid_xd", role: "Co-Founder" },
  ],
};

const COLS = 96; // texture width in blocks; one block = 100vw / 96

// ---------- Seeded randomness so textures look the same on every load ----------
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const seedOf = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// ---------- Layer palettes ----------
const LAYERS = {
  dirt: {
    shades: ["#6e4b2e", "#76522f", "#654328", "#7c5836", "#6a472b"],
    top: ["#5fa23a", "#6aaf42", "#57953a", "#65a83d"],
    ores: [],
  },
  stone: {
    shades: ["#5b5b5e", "#626265", "#555558", "#68686b", "#5f5f62"],
    ores: [
      { colors: ["#2a2a2d", "#1f1f22"], per100: 9, size: 5 },  // coal
      { colors: ["#c9a27e", "#b8906c"], per100: 5, size: 4 },  // iron
    ],
  },
  deepslate: {
    shades: ["#2e2f35", "#33343a", "#2a2b30", "#383940", "#303137"],
    ores: [
      { colors: ["#5fb4f5", "#2d6cf0"], per100: 5, size: 4 },  // diamond, tinted to the logo blues
      { colors: ["#f2c14e", "#c9962e"], per100: 3, size: 4 },  // gold
      { colors: ["#b02a24", "#8e1f1a"], per100: 4, size: 5 },  // redstone
    ],
  },
  bedrock: {
    shades: ["#19191b", "#232326", "#141416", "#2c2c30", "#1e1e21"],
    ores: [],
  },
};

// Keep ore veins in the side margins so they never sit behind text.
function oreColumn(r, margin) {
  return r() < 0.5 ? Math.floor(r() * margin) : COLS - 1 - Math.floor(r() * margin);
}

// Width of the empty side margin, in blocks, for this section at its current size.
function marginCols(section, cell) {
  const wrap = section.querySelector(".wrap");
  const left = wrap.getBoundingClientRect().left + parseFloat(getComputedStyle(wrap).paddingLeft);
  return Math.max(1, Math.floor(left / cell) - 2);
}

function paintLayer(section) {
  const name = section.dataset.layer;
  const cfg = LAYERS[name];
  const r = rng(seedOf(name));
  const cell = section.clientWidth / COLS;
  const rows = Math.ceil(section.clientHeight / cell) + 1;

  const canvas = document.createElement("canvas");
  canvas.width = COLS;
  canvas.height = rows;
  const g = canvas.getContext("2d");

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < COLS; x++) {
      g.fillStyle = pick(r, cfg.shades);
      g.fillRect(x, y, 1, 1);
    }
  }

  // Grass: solid top row, then drips hanging into the dirt.
  if (cfg.top) {
    for (let x = 0; x < COLS; x++) {
      g.fillStyle = pick(r, cfg.top);
      g.fillRect(x, 0, 1, 1);
      if (r() < 0.45) { g.fillStyle = pick(r, cfg.top); g.fillRect(x, 1, 1, 1); }
    }
  }

  const margin = marginCols(section, cell);
  for (const ore of cfg.ores) {
    const veins = Math.max(1, Math.round((ore.per100 * rows) / 100));
    for (let i = 0; i < veins; i++) {
      let x = oreColumn(r, margin);
      let y = 3 + Math.floor(r() * (rows - 6));
      for (let k = 0; k < ore.size; k++) {
        g.fillStyle = pick(r, ore.colors);
        g.fillRect(x, y, 1, 1);
        if (r() < 0.5) x += r() < 0.5 ? 1 : -1; else y += r() < 0.5 ? 1 : -1;
        x = x < COLS / 2 ? Math.min(Math.max(x, 0), margin - 1) : Math.max(Math.min(x, COLS - 1), COLS - margin);
      }
    }
  }

  section.style.backgroundImage = `url(${canvas.toDataURL()})`;
  paintEdge(section, cfg, r);
}

// Uneven block silhouette that pokes up into the layer above.
function paintEdge(section, cfg, r) {
  let edge = section.querySelector(":scope > .edge");
  if (!edge) {
    edge = document.createElement("canvas");
    edge.className = "edge";
    edge.setAttribute("aria-hidden", "true");
    section.prepend(edge);
  }
  const H = 3;
  edge.width = COLS;
  edge.height = H;
  const g = edge.getContext("2d");
  const colors = cfg.top || cfg.shades;
  let h = 1;
  for (let x = 0; x < COLS; x++) {
    const step = r();
    if (step < 0.28) h--; else if (step > 0.72) h++;
    h = Math.max(0, Math.min(H, h));
    for (let y = H - h; y < H; y++) {
      g.fillStyle = pick(r, colors);
      g.fillRect(x, y, 1, 1);
    }
  }
}

const layers = [...document.querySelectorAll("[data-layer]")];
let lastWidth = 0;
function paintAll() {
  if (document.documentElement.clientWidth === lastWidth) return;
  lastWidth = document.documentElement.clientWidth;
  layers.forEach(paintLayer);
}

// ---------- Item icons ----------
const ICONS = {
  pick: {
    colors: { D: "#8fcaf7", d: "#2d6cf0", H: "#c99a5b" },
    px: [
      "..DDD.....",
      ".....dD...",
      ".......D..",
      "......H.D.",
      ".....H..D.",
      "....H....D",
      "...H.....D",
      "..H......D",
      ".H........",
      "H.........",
    ],
  },
  sword: {
    colors: { B: "#dce8ea", b: "#9fb3b8", G: "#f2c14e", H: "#c99a5b" },
    px: [
      ".........B",
      "........Bb",
      ".......Bb.",
      "......Bb..",
      ".....Bb...",
      "..G.Bb....",
      "...Gb.....",
      "...HG.....",
      "..H..G....",
      ".H........",
    ],
  },
  chest: {
    colors: { O: "#3b2512", W: "#c98b3e", w: "#a8702e", L: "#dcdcdc" },
    px: [
      "OOOOOOOOOO",
      "OWWWWWWWWO",
      "OwwwwwwwwO",
      "OWWWWWWWWO",
      "OOOOLLOOOO",
      "OWWWLLWWWO",
      "OwwwwwwwwO",
      "OWWWWWWWWO",
      "OwwwwwwwwO",
      "OOOOOOOOOO",
    ],
  },
};

document.querySelectorAll("canvas[data-icon]").forEach((c) => {
  const icon = ICONS[c.dataset.icon];
  const g = c.getContext("2d");
  icon.px.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      g.fillStyle = icon.colors[ch];
      g.fillRect(x, y, 1, 1);
    })
  );
});

// ---------- Config into the page ----------
document.querySelectorAll("[data-ip]").forEach((el) => (el.textContent = CONFIG.ip));
document.querySelectorAll("[data-port]").forEach((el) => (el.textContent = CONFIG.bedrockPort));
document.querySelectorAll("[data-discord]").forEach((el) => {
  el.href = CONFIG.discord;
  el.rel = "noopener";
  el.target = "_blank";
});

document.querySelectorAll("[data-store]").forEach((el) => {
  el.href = CONFIG.store;
  el.rel = "noopener";
  el.target = "_blank";
});

// ---------- Staff ----------
const staffList = document.getElementById("staffList");
CONFIG.staff.forEach((s) => {
  const li = document.createElement("li");
  li.className = "staff-card";
  if (s.owner) li.dataset.owner = "";
  const img = document.createElement("img");
  img.src = `https://mc-heads.net/avatar/${encodeURIComponent(s.name)}/64`;
  img.alt = "";
  img.width = img.height = 64;
  img.loading = "lazy";
  const text = document.createElement("div");
  const name = document.createElement("p");
  name.className = "staff-name";
  name.textContent = s.name;
  const role = document.createElement("p");
  role.className = "staff-role";
  role.textContent = s.role;
  text.append(name, role);
  li.append(img, text);
  staffList.append(li);
});

// ---------- Discord online count ----------
if (CONFIG.discordServerId) {
  const countEl = document.getElementById("discordCount");
  fetch(`https://discord.com/api/guilds/${encodeURIComponent(CONFIG.discordServerId)}/widget.json`)
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((data) => {
      countEl.textContent = `${data.presence_count} members online now`;
      countEl.hidden = false;
    })
    .catch(() => {}); // widget disabled or unreachable: keep the box as-is
}

// ---------- Copy IP ----------
const copyBtn = document.querySelector("[data-copy]");
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(CONFIG.ip);
    copyBtn.textContent = "Copied";
  } catch {
    copyBtn.textContent = "Select and copy";
  }
  setTimeout(() => (copyBtn.textContent = "Copy IP"), 1800);
});

// ---------- Live server status ----------
const statusEl = document.getElementById("status");
const statusText = document.getElementById("statusText");
fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(CONFIG.ip)}`)
  .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
  .then((data) => {
    if (data.online) {
      statusEl.dataset.state = "online";
      statusText.textContent = `${data.players.online} / ${data.players.max} players online`;
    } else {
      statusEl.dataset.state = "offline";
      statusText.textContent = "Server offline";
    }
  })
  .catch(() => (statusText.textContent = "Status unavailable"));

// ---------- Depth meter ----------
const stops = [...document.querySelectorAll("[data-stop]")];
const depthY = document.getElementById("depthY");
const depthName = document.getElementById("depthName");
const marker = document.getElementById("depthMarker");
const Y_TOP = 110, Y_BOTTOM = -64;

function updateDepth() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - innerHeight;
  const progress = max > 0 ? scrollY / max : 0;
  // The probe slides from the top of the page to the bottom as you scroll.
  const probe = scrollY + innerHeight * progress;

  let y = Y_BOTTOM, name = stops[stops.length - 1].dataset.stop;
  for (const el of stops) {
    const top = el.offsetTop, h = el.offsetHeight;
    if (probe < top + h) {
      const t = Math.min(1, Math.max(0, (probe - top) / h));
      const from = +el.dataset.yFrom, to = +el.dataset.yTo;
      y = Math.round(from + (to - from) * t);
      name = el.dataset.stop;
      break;
    }
  }
  depthY.textContent = y;
  depthName.textContent = name;
  marker.style.top = `${((Y_TOP - y) / (Y_TOP - Y_BOTTOM)) * 100}%`;
}

let ticking = false;
addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { updateDepth(); ticking = false; });
}, { passive: true });

let resizeTimer;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { paintAll(); updateDepth(); }, 150);
});

document.fonts.ready.then(() => { lastWidth = 0; paintAll(); updateDepth(); });
paintAll();
updateDepth();
