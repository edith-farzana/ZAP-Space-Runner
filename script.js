const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const selectScreen = document.getElementById("select-screen");
const gameScreen = document.getElementById("game-screen");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const backButton = document.getElementById("back-button");
const overlay = document.getElementById("game-overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlaySummary = document.getElementById("overlay-summary");
const scoreValue = document.getElementById("score-value");
const speedValue = document.getElementById("speed-value");
const menuHighScore = document.getElementById("menu-high-score");
const hudHighScore = document.getElementById("hud-high-score");
const heartContainer = document.getElementById("heart-container");
const encouragementText = document.getElementById("encouragement-text");

const STORAGE_KEY = "pixel-space-sprint-high-score";
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const PLAYER_SCALE = 4;
const BASE_SCROLL_SPEED = 250;
const BOOST_MULTIPLIER = 1.8;
const SPEED_GROWTH_PER_POINT = 0.28;
const MAX_SPEED_BONUS = 220;

const BACKGROUND_THEMES = [
  { top: "#0d1839", mid: "#0a1230", bottom: "#060912", star: "#8eefff", lane: "124, 246, 255" },
  { top: "#2a0f42", mid: "#43165f", bottom: "#12051d", star: "#ffd8ff", lane: "255, 113, 222" },
  { top: "#113248", mid: "#0f5863", bottom: "#04141b", star: "#9effef", lane: "102, 255, 224" },
  { top: "#43220d", mid: "#653015", bottom: "#1f0c04", star: "#ffe199", lane: "255, 188, 84" },
  { top: "#1d244a", mid: "#17307e", bottom: "#090c22", star: "#aaccff", lane: "110, 160, 255" },
  { top: "#3d1129", mid: "#60153b", bottom: "#18050d", star: "#ffb9cb", lane: "255, 120, 171" }
];

const ENCOURAGEMENT_LINES = [
  "You got this.",
  "Nice flying. Stay calm.",
  "Sharp moves. Keep going.",
  "You are beating the storm.",
  "Fast hands, steady aim.",
  "Almost there. Hold strong.",
  "Legend run in progress."
];

const spriteCatalog = {
  violet: {
    label: "Violet Rocket",
    map: [
      "....A.....",
      "...ABA....",
      "...ACA....",
      "..ADDEA...",
      "..DFFFGD..",
      "..DFFFGD..",
      ".DHFIIFHD.",
      "...J..J...",
      "..K....K..",
      ".........."
    ],
    colors: {
      A: "#ffe8ff",
      B: "#ffc8ff",
      C: "#8fe6ff",
      D: "#a367ff",
      E: "#7d3dff",
      F: "#ff86eb",
      G: "#f9d3ff",
      H: "#ff61d4",
      I: "#ffc0f5",
      J: "#ffab54",
      K: "#ffe374"
    },
    glow: "rgba(244, 118, 255, 0.34)",
    flame: ["#ffd567", "#ff8c47"]
  },
  frost: {
    label: "Ice Rocket",
    map: [
      "....A.....",
      "...ABA....",
      "...ACA....",
      "..ADDEA...",
      "..DFFFGD..",
      "..DFFFGD..",
      ".DHFIIFHD.",
      "...J..J...",
      "..K....K..",
      ".........."
    ],
    colors: {
      A: "#effbff",
      B: "#b8f3ff",
      C: "#7dc3ff",
      D: "#86b9ff",
      E: "#4d7bff",
      F: "#baf8ff",
      G: "#effaff",
      H: "#76e0ff",
      I: "#9bd2ff",
      J: "#ffbf68",
      K: "#ffe995"
    },
    glow: "rgba(127, 221, 255, 0.34)",
    flame: ["#fff0ad", "#7ed9ff"]
  },
  solar: {
    label: "Solar Rocket",
    map: [
      "....A.....",
      "...ABA....",
      "...ACA....",
      "..ADDEA...",
      "..DFFFGD..",
      "..DFFFGD..",
      ".DHFIIFHD.",
      "...J..J...",
      "..K....K..",
      ".........."
    ],
    colors: {
      A: "#fff6cb",
      B: "#ffd977",
      C: "#ff9b54",
      D: "#ffbc43",
      E: "#ff7a36",
      F: "#ffe086",
      G: "#fff4d4",
      H: "#ffcf4a",
      I: "#ffc96b",
      J: "#ff9354",
      K: "#ffef8b"
    },
    glow: "rgba(255, 193, 84, 0.34)",
    flame: ["#fff2af", "#ff7a3e"]
  }
};

const obstacleSprites = {
  ufo: {
    map: [
      "....AAA....",
      "...ABDBA...",
      "..ACEEECA..",
      ".FCEEEEECF.",
      "..GG...GG..",
      ".HH.....HH.",
      "..........."
    ],
    colors: {
      A: "#7f6cff",
      B: "#b8aaff",
      C: "#6f78ff",
      D: "#4ce6ff",
      E: "#c5cfff",
      F: "#ff6fd8",
      G: "#7b4cff",
      H: "#ff9f5a"
    }
  },
  portal: {
    map: [
      "...AABB....",
      "..AACCCB...",
      ".AACDDDCB..",
      ".ACDDEEDCB.",
      ".ACDEFFDCB.",
      ".BCDDEEDCA.",
      "..BCCDDCA..",
      "...ABBBA..."
    ],
    colors: {
      A: "#ff8dff",
      B: "#b56cff",
      C: "#7c4eff",
      D: "#ff6ddb",
      E: "#ffb0f7",
      F: "#5d2bff"
    }
  },
  comet: {
    map: [
      ".......AA...",
      ".....ABCCA..",
      "...ADDEEFA..",
      ".AGDDEEEEHH.",
      "..IJDDEEFK..",
      "...LLMMNN..."
    ],
    colors: {
      A: "#ff9c54",
      B: "#ffd15d",
      C: "#ff6d3d",
      D: "#ff7f47",
      E: "#ffb05c",
      F: "#fff2b7",
      G: "#ff4f73",
      H: "#ff8453",
      I: "#ff65ff",
      J: "#ff9bda",
      K: "#ff6e5d",
      L: "#ff6ed8",
      M: "#c85cff",
      N: "#8a55ff"
    }
  },
  eye: {
    map: [
      "....AAAA....",
      "...ABCCBA...",
      "..ADDEEDDA..",
      ".ADDEFFEDDA.",
      ".ADDFGGFDDA.",
      "..AHIIIIHA..",
      "...J....J...",
      "..J......J.."
    ],
    colors: {
      A: "#89ffda",
      B: "#d7fff6",
      C: "#ff7de7",
      D: "#77e5c1",
      E: "#f6fff8",
      F: "#99ff42",
      G: "#262f4b",
      H: "#56c8a6",
      I: "#b26cff",
      J: "#ff78d5"
    }
  },
  crystal: {
    map: [
      "....A....",
      "...ABA...",
      "..ABCCA..",
      ".ABCDDCBA.",
      "..AEEEEA..",
      "...EFFA...",
      "..G....G.."
    ],
    colors: {
      A: "#ffb8ff",
      B: "#ff7fd8",
      C: "#fff0ff",
      D: "#b66aff",
      E: "#7f58ff",
      F: "#ff6ec7",
      G: "#ffd46d"
    }
  },
  emberPlanet: {
    map: [
      "...AAAA....",
      "..ABBCCAA..",
      ".ABCDDDCEA.",
      ".ACDDDDEEA.",
      ".ACDFFFEEA.",
      ".ACDFFGEEA.",
      ".ABEEEEEAA.",
      "..AAHHHAA..",
      "....AAA...."
    ],
    colors: {
      A: "#ffb35e",
      B: "#ff8750",
      C: "#f8664c",
      D: "#ff7440",
      E: "#ffcf70",
      F: "#ff5252",
      G: "#ffe29d",
      H: "#ff9f5a"
    }
  },
  aquaPlanet: {
    map: [
      "...AAAA....",
      "..ABBBBAA..",
      ".ABCDEFBA..",
      ".ABDEEFFBA.",
      ".ABDEEFFBA.",
      ".ABCDDEEBA.",
      ".ABBEEEEAA.",
      "..AAFGFAA..",
      "....AAA...."
    ],
    colors: {
      A: "#76ecff",
      B: "#46c5ff",
      C: "#aaf8ff",
      D: "#35a9ff",
      E: "#6fe2ff",
      F: "#dffcff",
      G: "#2d8fff"
    }
  },
  earthPlanet: {
    map: [
      "...AAAA....",
      "..ABBBBAA..",
      ".ABCDBCBA..",
      ".ABDDDCEBA.",
      ".ABDDDEEBA.",
      ".ABCDEEEBA.",
      ".ABCCEEBAA.",
      "..AAFEEAA..",
      "....AAA...."
    ],
    colors: {
      A: "#9dc4ff",
      B: "#367dff",
      C: "#49d17f",
      D: "#2ba85f",
      E: "#efffff",
      F: "#4d8eff"
    }
  },
  sunStar: {
    map: [
      "....AA....",
      "..AABBAA..",
      ".ABCCCCBA.",
      ".ACDDDCCA.",
      "ABCDDDDCEA",
      ".ACDDDCCA.",
      ".ABCCCCBA.",
      "..AABBAA..",
      "....AA...."
    ],
    colors: {
      A: "#ffda64",
      B: "#ffb449",
      C: "#ff9437",
      D: "#ff6d2f",
      E: "#fff0ab"
    }
  },
  mushroomUfo: {
    map: [
      "...AAAA...",
      "..ABCCBA..",
      ".ADCEECDA.",
      ".AFGGGGFA.",
      "..HH..HH..",
      ".II....II."
    ],
    colors: {
      A: "#d7c6ff",
      B: "#ff8fcb",
      C: "#ff5f84",
      D: "#fff1ff",
      E: "#ffd5ff",
      F: "#6b78ff",
      G: "#9eb7ff",
      H: "#ffae59",
      I: "#7cf0ff"
    }
  },
  diamondGem: {
    map: [
      "....A....",
      "...ABA...",
      "..ABCBA..",
      ".ABCDCBA.",
      "..AECFA..",
      "...AGA...",
      "....H...."
    ],
    colors: {
      A: "#ffd4ff",
      B: "#ff7fd8",
      C: "#b268ff",
      D: "#fff6ff",
      E: "#7f59ff",
      F: "#ff56c4",
      G: "#ff8bde",
      H: "#ffd96f"
    }
  },
  shield: {
    map: [
      "...AAAA...",
      "..ABBBBA..",
      "..ABCCCBA.",
      "..ABCCCBA.",
      "...BDDDB..",
      "....BDB..."
    ],
    colors: {
      A: "#aef5ff",
      B: "#65ccff",
      C: "#efffff",
      D: "#5a8fff"
    }
  },
  hourglass: {
    map: [
      "AAAAAAA",
      ".ABBBA.",
      "..BCB..",
      "...D...",
      "..ECE..",
      ".AEEEA.",
      "AAAAAAA"
    ],
    colors: {
      A: "#ff8dc9",
      B: "#7e5aff",
      C: "#fff3ff",
      D: "#ffd96b",
      E: "#5e3fff"
    }
  },
  asteroidDark: {
    map: [
      "...AAA....",
      "..ABBBAA..",
      ".ABCCCBA..",
      ".ABCCCCBA.",
      ".ABCBCCBA.",
      "..ABCCBA..",
      "...AAAA..."
    ],
    colors: {
      A: "#74788e",
      B: "#4e5369",
      C: "#2e3447"
    }
  },
  asteroidCloud: {
    map: [
      "...AAA....",
      "..ABCCAA..",
      ".ABCCCCBA.",
      ".ACCCCCCA.",
      "..ABCCCBA.",
      "...ABBBA.."
    ],
    colors: {
      A: "#737a87",
      B: "#575f6c",
      C: "#383f4c"
    }
  },
  enemyPurpleShip: {
    map: [
      "....AA....",
      "...ABBA...",
      "..ACDDCA..",
      ".EEFDDFEE.",
      "..GGHHGG..",
      ".I......I.",
      "J........J"
    ],
    colors: {
      A: "#ffca66",
      B: "#ff8a46",
      C: "#ba7aff",
      D: "#8157ff",
      E: "#9f6cff",
      F: "#52dfff",
      G: "#6f4fff",
      H: "#3bb9ff",
      I: "#ffc85b",
      J: "#ff7d54"
    }
  },
  enemyRedShip: {
    map: [
      "....AA....",
      "...ABBA...",
      "..ACDDCA..",
      ".EEFDDFEE.",
      "..GGHHGG..",
      ".I......I.",
      "J........J"
    ],
    colors: {
      A: "#ffcf6f",
      B: "#ff933f",
      C: "#ff7260",
      D: "#d93838",
      E: "#ff5148",
      F: "#62e8ff",
      G: "#ff7d49",
      H: "#39bfff",
      I: "#ffcb60",
      J: "#ff7c45"
    }
  },
  enemyBlueShip: {
    map: [
      "....AA....",
      "...ABBA...",
      "..ACDDCA..",
      ".EEFDDFEE.",
      "..GGHHGG..",
      ".I......I.",
      "J........J"
    ],
    colors: {
      A: "#ffc96b",
      B: "#ff8f45",
      C: "#7fe3ff",
      D: "#4db8ff",
      E: "#55cfff",
      F: "#d9f6ff",
      G: "#6fb6ff",
      H: "#7eefff",
      I: "#ffce72",
      J: "#ff7f4d"
    }
  },
  twinEngineShip: {
    map: [
      "....AA....",
      "...ABBA...",
      ".CCDDDDEE.",
      ".CFGGGGHC.",
      "..IIJJII..",
      ".K......K.",
      "L........L"
    ],
    colors: {
      A: "#fff3d9",
      B: "#7ce7ff",
      C: "#dfe9ff",
      D: "#90c8ff",
      E: "#ffb14f",
      F: "#95baff",
      G: "#f6fbff",
      H: "#6bb4ff",
      I: "#7ec8ff",
      J: "#4d78ff",
      K: "#ffbd63",
      L: "#ff8a4a"
    }
  },
  droneColumn: {
    map: [
      "..A..A..",
      "..BCDB..",
      "..BCDB..",
      "..BCDB..",
      "..BCDB..",
      "..EFFE..",
      "..EFFE.."
    ],
    colors: {
      A: "#ffb555",
      B: "#7de8ff",
      C: "#4aaeff",
      D: "#dffaff",
      E: "#8f5dff",
      F: "#ff7af0"
    }
  }
};

const obstacleProfiles = [
  { type: "ufo", spriteKey: "ufo", scale: 4, drift: 18, bonusSpeed: 22, glow: "rgba(160, 120, 255, 0.32)" },
  { type: "portal", spriteKey: "portal", scale: 4, drift: 22, bonusSpeed: 28, glow: "rgba(255, 109, 219, 0.28)" },
  { type: "mushroomUfo", spriteKey: "mushroomUfo", scale: 4, drift: 17, bonusSpeed: 26, glow: "rgba(255, 145, 205, 0.28)" },
  { type: "comet", spriteKey: "comet", scale: 4, drift: 10, bonusSpeed: 42, glow: "rgba(255, 140, 79, 0.30)" },
  { type: "eye", spriteKey: "eye", scale: 4, drift: 16, bonusSpeed: 24, glow: "rgba(124, 255, 214, 0.28)" },
  { type: "crystal", spriteKey: "crystal", scale: 4, drift: 20, bonusSpeed: 30, glow: "rgba(255, 118, 222, 0.26)" },
  { type: "diamondGem", spriteKey: "diamondGem", scale: 4, drift: 18, bonusSpeed: 28, glow: "rgba(255, 126, 214, 0.28)" },
  { type: "shield", spriteKey: "shield", scale: 4, drift: 14, bonusSpeed: 20, glow: "rgba(116, 214, 255, 0.26)" },
  { type: "hourglass", spriteKey: "hourglass", scale: 4, drift: 12, bonusSpeed: 20, glow: "rgba(191, 121, 255, 0.24)" },
  { type: "emberPlanet", spriteKey: "emberPlanet", scale: 4, drift: 8, bonusSpeed: 18, glow: "rgba(255, 183, 87, 0.26)" },
  { type: "aquaPlanet", spriteKey: "aquaPlanet", scale: 4, drift: 8, bonusSpeed: 18, glow: "rgba(101, 224, 255, 0.26)" },
  { type: "earthPlanet", spriteKey: "earthPlanet", scale: 4, drift: 8, bonusSpeed: 19, glow: "rgba(107, 188, 255, 0.24)" },
  { type: "sunStar", spriteKey: "sunStar", scale: 4, drift: 9, bonusSpeed: 20, glow: "rgba(255, 191, 90, 0.28)" },
  { type: "asteroidDark", spriteKey: "asteroidDark", scale: 4, drift: 15, bonusSpeed: 26, glow: "rgba(120, 127, 151, 0.20)" },
  { type: "asteroidCloud", spriteKey: "asteroidCloud", scale: 4, drift: 13, bonusSpeed: 24, glow: "rgba(120, 127, 151, 0.18)" },
  { type: "enemyPurpleShip", spriteKey: "enemyPurpleShip", scale: 4, drift: 18, bonusSpeed: 32, glow: "rgba(167, 116, 255, 0.28)" },
  { type: "enemyRedShip", spriteKey: "enemyRedShip", scale: 4, drift: 17, bonusSpeed: 34, glow: "rgba(255, 110, 88, 0.28)" },
  { type: "enemyBlueShip", spriteKey: "enemyBlueShip", scale: 4, drift: 17, bonusSpeed: 33, glow: "rgba(102, 211, 255, 0.28)" },
  { type: "twinEngineShip", spriteKey: "twinEngineShip", scale: 4, drift: 12, bonusSpeed: 27, glow: "rgba(169, 222, 255, 0.24)" },
  { type: "droneColumn", spriteKey: "droneColumn", scale: 4, drift: 11, bonusSpeed: 36, glow: "rgba(129, 155, 255, 0.22)" }
];

const state = {
  selectedCharacter: "violet",
  running: false,
  animationId: 0,
  lastTime: 0,
  score: 0,
  scoreAtRoundStart: 0,
  highScore: loadHighScore(),
  lives: 3,
  invulnerableTimer: 0,
  spawnTimer: 0,
  nextSpawnDelay: 0.95,
  flashTimer: 0,
  player: {
    x: 170,
    y: GAME_HEIGHT / 2,
    width: 40,
    height: 40
  },
  obstacles: [],
  obstacleHistory: [],
  keys: {
    up: false,
    down: false,
    boost: false
  },
  stars: createStars(),
  planets: createBackgroundPlanets()
};

function loadHighScore() {
  try {
    return Number.parseInt(window.localStorage.getItem(STORAGE_KEY) || "0", 10) || 0;
  } catch (error) {
    return 0;
  }
}

function saveHighScore() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(state.highScore));
  } catch (error) {
    // Ignore storage issues and keep the game playable.
  }
}

function getSpriteMetrics(sprite, scale) {
  const widestRow = sprite.map.reduce((widest, row) => Math.max(widest, row.length), 0);
  return {
    width: widestRow * scale,
    height: sprite.map.length * scale
  };
}

function syncPlayerSize() {
  const sprite = spriteCatalog[state.selectedCharacter];
  const metrics = getSpriteMetrics(sprite, PLAYER_SCALE);
  state.player.width = metrics.width;
  state.player.height = metrics.height;
}

function createStars() {
  return Array.from({ length: 64 }, () => ({
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT,
    size: Math.random() > 0.75 ? 4 : 2,
    layer: Math.random() > 0.55 ? 1.2 : 0.6
  }));
}

function createBackgroundPlanets() {
  return Array.from({ length: 4 }, (_, index) => ({
    x: 240 + index * 220,
    y: 90 + Math.random() * 320,
    radius: 18 + Math.random() * 24,
    hue: ["#ffb75e", "#7bd7ff", "#ff8fdc", "#ffd76a"][index % 4],
    alpha: 0.14 + Math.random() * 0.18
  }));
}

function currentTheme() {
  const scoreBand = Math.floor(state.score / 200);
  return BACKGROUND_THEMES[scoreBand % BACKGROUND_THEMES.length];
}

function currentBaseSpeed() {
  return BASE_SCROLL_SPEED + Math.min(MAX_SPEED_BONUS, state.score * SPEED_GROWTH_PER_POINT);
}

function currentEncouragement() {
  const index = Math.min(
    ENCOURAGEMENT_LINES.length - 1,
    Math.floor(state.score / 180)
  );
  return ENCOURAGEMENT_LINES[index];
}

function updateHighScoreLabels() {
  menuHighScore.textContent = state.highScore;
  hudHighScore.textContent = state.highScore;
}

function updateEncouragement() {
  encouragementText.textContent = currentEncouragement();
}

function chooseObstacleProfile() {
  const recentTypes = state.obstacleHistory.slice(-4);
  const freshProfiles = obstacleProfiles.filter((profile) => !recentTypes.includes(profile.type));
  const pool = freshProfiles.length >= 6 ? freshProfiles : obstacleProfiles;
  const profile = pool[Math.floor(Math.random() * pool.length)];
  state.obstacleHistory.push(profile.type);
  if (state.obstacleHistory.length > 8) {
    state.obstacleHistory.shift();
  }
  return profile;
}

function renderHearts() {
  heartContainer.innerHTML = "";
  for (let index = 0; index < 3; index += 1) {
    const heart = document.createElement("span");
    heart.className = `heart${index >= state.lives ? " lost" : ""}`;
    heart.setAttribute("aria-hidden", "true");
    heartContainer.appendChild(heart);
  }
}

function setSelectedCharacter(characterKey) {
  state.selectedCharacter = characterKey;
  syncPlayerSize();
  document.querySelectorAll(".character-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.character === characterKey);
  });
}

function showScreen(target) {
  selectScreen.classList.toggle("screen-active", target === "select");
  gameScreen.classList.toggle("screen-active", target === "game");
}

function drawPreview(canvasNode, sprite) {
  const previewContext = canvasNode.getContext("2d");
  previewContext.imageSmoothingEnabled = false;
  previewContext.clearRect(0, 0, canvasNode.width, canvasNode.height);
  const scale = 6;
  const metrics = getSpriteMetrics(sprite, scale);
  const x = Math.floor((canvasNode.width - metrics.width) / 2);
  const y = Math.floor((canvasNode.height - metrics.height) / 2);
  drawSprite(previewContext, sprite, x, y, scale);
}

function drawSprite(targetContext, sprite, x, y, scale) {
  sprite.map.forEach((row, rowIndex) => {
    row.split("").forEach((pixel, columnIndex) => {
      if (pixel === ".") {
        return;
      }
      targetContext.fillStyle = sprite.colors[pixel];
      targetContext.fillRect(x + columnIndex * scale, y + rowIndex * scale, scale, scale);
    });
  });
}

function startGame() {
  state.running = true;
  state.lastTime = 0;
  state.score = 0;
  state.scoreAtRoundStart = state.highScore;
  state.lives = 3;
  state.invulnerableTimer = 0;
  state.flashTimer = 0;
  state.spawnTimer = 0;
  state.nextSpawnDelay = 0.9;
  state.obstacleHistory = [];
  syncPlayerSize();
  state.player.y = GAME_HEIGHT / 2 - state.player.height / 2;
  state.obstacles = [];

  scoreValue.textContent = "0";
  speedValue.textContent = "100%";
  updateEncouragement();
  renderHearts();
  updateHighScoreLabels();
  overlay.classList.add("hidden");
  showScreen("game");

  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
  }
  state.animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
  state.running = false;
  cancelAnimationFrame(state.animationId);
  state.animationId = 0;

  const roundedScore = Math.floor(state.score);
  const isRecord = roundedScore > state.scoreAtRoundStart;
  overlayTitle.textContent = isRecord ? "New High Score" : "Game Over";
  overlaySummary.textContent = isRecord
    ? `You reached ${roundedScore} points and set a new all-time record.`
    : `Your final score is ${roundedScore}. High score: ${state.highScore}.`;
  overlay.classList.remove("hidden");
}

function createObstacle() {
  const profile = chooseObstacleProfile();
  const sprite = obstacleSprites[profile.spriteKey];
  const metrics = getSpriteMetrics(sprite, profile.scale);
  const margin = 42;
  const y = margin + Math.random() * (GAME_HEIGHT - metrics.height - margin * 2);

  state.obstacles.push({
    ...profile,
    sprite,
    width: metrics.width,
    height: metrics.height,
    x: GAME_WIDTH + 40,
    y,
    wobble: Math.random() * Math.PI * 2,
    pulse: 0.4 + Math.random() * 0.8,
    blink: Math.random() < 0.07,
    hit: false
  });
}

function updatePlayer(delta, boostMultiplier) {
  const moveSpeed = 310;
  if (state.keys.up) {
    state.player.y -= moveSpeed * delta;
  }
  if (state.keys.down) {
    state.player.y += moveSpeed * delta;
  }
  state.player.y += Math.sin(performance.now() / 170) * 0.22;

  const minY = 20;
  const maxY = GAME_HEIGHT - state.player.height - 20;
  state.player.y = Math.max(minY, Math.min(maxY, state.player.y));

  const pointsGain = delta * 28 * boostMultiplier;
  state.score += pointsGain;
  const roundedScore = Math.floor(state.score);
  scoreValue.textContent = roundedScore;
  updateEncouragement();

  if (roundedScore > state.highScore) {
    state.highScore = roundedScore;
    saveHighScore();
    updateHighScoreLabels();
  }
}

function updateObstacles(delta, speed) {
  state.spawnTimer += delta;
  const difficultyAdjust = Math.min(state.score / 1200, 0.44);
  if (state.spawnTimer >= state.nextSpawnDelay - difficultyAdjust) {
    state.spawnTimer = 0;
    state.nextSpawnDelay = 0.5 + Math.random() * 0.42;
    createObstacle();
    if (state.score > 350 && Math.random() < Math.min(0.32, state.score / 2200)) {
      createObstacle();
    }
  }

  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -120);

  state.obstacles.forEach((obstacle) => {
    obstacle.wobble += delta * obstacle.pulse;
    obstacle.x -= (speed + obstacle.bonusSpeed) * delta;
    obstacle.y += Math.sin(obstacle.wobble) * obstacle.drift * delta;

    if (!obstacle.hit && isColliding(playerHitbox(), obstacleHitbox(obstacle))) {
      obstacle.hit = true;
      registerHit();
    }
  });
}

function registerHit() {
  if (state.invulnerableTimer > 0) {
    return;
  }
  state.lives -= 1;
  state.invulnerableTimer = 1.25;
  state.flashTimer = 0.35;
  renderHearts();

  if (state.lives <= 0) {
    endGame();
  }
}

function playerHitbox() {
  return {
    x: state.player.x + 8,
    y: state.player.y + 8,
    width: state.player.width - 14,
    height: state.player.height - 14
  };
}

function obstacleHitbox(obstacle) {
  return {
    x: obstacle.x + 8,
    y: obstacle.y + 8,
    width: obstacle.width - 16,
    height: obstacle.height - 16
  };
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function gameLoop(timestamp) {
  if (!state.running) {
    return;
  }

  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const delta = Math.min((timestamp - state.lastTime) / 1000, 0.033);
  state.lastTime = timestamp;

  const boostMultiplier = state.keys.boost ? BOOST_MULTIPLIER : 1;
  const baseSpeed = currentBaseSpeed();
  const speed = baseSpeed * boostMultiplier;
  speedValue.textContent = `${Math.round((speed / BASE_SCROLL_SPEED) * 100)}%`;

  if (state.invulnerableTimer > 0) {
    state.invulnerableTimer = Math.max(0, state.invulnerableTimer - delta);
  }
  if (state.flashTimer > 0) {
    state.flashTimer = Math.max(0, state.flashTimer - delta);
  }

  updatePlayer(delta, boostMultiplier);
  updateObstacles(delta, speed);
  render(speed);

  if (state.running) {
    state.animationId = requestAnimationFrame(gameLoop);
  }
}

function render(speed) {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  drawBackground(speed);
  drawTrails(speed);
  drawObstacles();
  drawPlayer();
  drawForegroundGlow();
}

function drawBackground(speed) {
  const theme = currentTheme();
  const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  sky.addColorStop(0, theme.top);
  sky.addColorStop(0.55, theme.mid);
  sky.addColorStop(1, theme.bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  state.planets.forEach((planet, index) => {
    const shift = (performance.now() * 0.01 * (0.2 + index * 0.08)) % (GAME_WIDTH + 160);
    const drawX = planet.x - shift;
    ctx.globalAlpha = planet.alpha;
    ctx.fillStyle = planet.hue;
    ctx.beginPath();
    ctx.arc(drawX, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(drawX - planet.radius * 0.2, planet.y - 2, planet.radius * 1.4, 4);
    ctx.globalAlpha = 1;
  });

  state.stars.forEach((star) => {
    star.x -= speed * 0.02 * star.layer;
    if (star.x < -10) {
      star.x = GAME_WIDTH + 10;
      star.y = Math.random() * GAME_HEIGHT;
    }
    ctx.fillStyle = star.layer > 1 ? "#ffffff" : theme.star;
    ctx.fillRect(Math.round(star.x), Math.round(star.y), star.size, star.size);
  });

  for (let band = 0; band < 6; band += 1) {
    ctx.fillStyle = `rgba(${theme.lane}, ${0.015 + band * 0.01})`;
    ctx.fillRect(0, GAME_HEIGHT - 90 + band * 14, GAME_WIDTH, 2);
  }
}

function drawTrails(speed) {
  const lines = 14;
  const intensity = state.keys.boost ? 0.38 : 0.18;
  for (let index = 0; index < lines; index += 1) {
    const y = 32 + index * 34 + Math.sin((performance.now() / 220) + index) * 6;
    const width = 120 + index * 18;
    const offset = (performance.now() * 0.32 * (speed / BASE_SCROLL_SPEED) + index * 50) % (GAME_WIDTH + width);
    ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
    ctx.fillRect(GAME_WIDTH - offset, y, width, 2);
  }
}

function drawObstacles() {
  state.obstacles.forEach((obstacle) => {
    const isBlinkHidden =
      obstacle.blink &&
      Math.floor(performance.now() / 130 + obstacle.wobble * 10) % 7 === 0;
    if (isBlinkHidden) {
      return;
    }
    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = obstacle.glow;
    drawSprite(ctx, obstacle.sprite, obstacle.x, obstacle.y, obstacle.scale);
    ctx.restore();
  });
}

function drawPlayer() {
  const sprite = spriteCatalog[state.selectedCharacter];
  const isBlinking = state.invulnerableTimer > 0 && Math.floor(state.invulnerableTimer * 12) % 2 === 0;
  if (isBlinking) {
    return;
  }

  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = sprite.glow;
  drawSprite(ctx, sprite, state.player.x, state.player.y, PLAYER_SCALE);
  ctx.restore();

  const flameLength = state.keys.boost ? 26 : 16;
  const flameY = state.player.y + Math.floor(state.player.height * 0.55);
  ctx.fillStyle = sprite.flame[0];
  ctx.fillRect(state.player.x - flameLength, flameY, flameLength - 6, 6);
  ctx.fillStyle = sprite.flame[1];
  ctx.fillRect(state.player.x - flameLength - 6, flameY + 2, flameLength, 4);
}

function drawForegroundGlow() {
  if (state.flashTimer <= 0) {
    return;
  }
  ctx.fillStyle = `rgba(255, 95, 122, ${state.flashTimer})`;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function bindEvents() {
  document.querySelectorAll(".character-card").forEach((card) => {
    card.addEventListener("click", () => setSelectedCharacter(card.dataset.character));
  });

  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", startGame);
  backButton.addEventListener("click", () => {
    state.running = false;
    cancelAnimationFrame(state.animationId);
    state.animationId = 0;
    overlay.classList.add("hidden");
    showScreen("select");
  });

  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowRight", "Space"].includes(event.key)) {
      event.preventDefault();
    }

    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
      state.keys.up = true;
    }
    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
      state.keys.down = true;
    }
    if (event.key === "ArrowRight") {
      state.keys.boost = true;
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
      state.keys.up = false;
    }
    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
      state.keys.down = false;
    }
    if (event.key === "ArrowRight") {
      state.keys.boost = false;
    }
  });
}

function init() {
  Object.entries(spriteCatalog).forEach(([key, sprite]) => {
    const previewCanvas = document.querySelector(`[data-preview="${key}"]`);
    drawPreview(previewCanvas, sprite);
  });

  bindEvents();
  setSelectedCharacter(state.selectedCharacter);
  updateHighScoreLabels();
  renderHearts();
  render(BASE_SCROLL_SPEED);
}

init();
